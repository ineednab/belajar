import * as Crypto from 'expo-crypto';
import { getCalendars } from 'expo-localization';
import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View, type TextInput } from 'react-native';

import { AppText } from '@/components/app-text';
import { EmptyState } from '@/components/empty-state';
import { Icon } from '@/components/icon';
import { JournalEditor } from '@/components/journal-editor';
import { PastDayCard } from '@/components/past-day-card';
import { PrimaryButton } from '@/components/primary-button';
import { ProfileSelector } from '@/components/profile-selector';
import { QuickLogButtons } from '@/components/quick-logs';
import { RetentionNotice } from '@/components/retention-notice';
import { Screen } from '@/components/screen';
import { SecondaryButton } from '@/components/secondary-button';
import { WeekStrip, type DayMark } from '@/components/week-strip';
import { getQuickLogs, NO_QUICK_LOGS, saveQuickLogs, type QuickLogKey, type QuickLogs } from '@/db/day-records';
import { getEntryForDate, listEntryMarks, saveEntry, type JournalEntry } from '@/db/entries';
import type { Profile } from '@/db/profiles';
import { useDatabase } from '@/db/provider';
import { getSetting, setSetting } from '@/db/settings';
import { useLocalToday } from '@/hooks/use-local-today';
import { compareLocalDates, diffCalendarDays, weekStartsOnFromLocale, type LocalDate } from '@/lib/date';
import { useProfiles } from '@/profiles/provider';
import { ICONS } from '@/theme/icons';
import { colors, spacing } from '@/theme/tokens';
import { fonts } from '@/theme/typography';

const WEEK_STARTS_ON = weekStartsOnFromLocale(getCalendars()[0]?.firstWeekday);

export default function TodayScreen() {
  const { activeProfile } = useProfiles();

  if (!activeProfile) {
    return (
      <Screen>
        <View style={styles.firstLaunch}>
          <EmptyState
            icon={ICONS.leaf}
            title="Jurnal untuk kata-kata yang tak bisa kamu kirim."
            body="Buat ruang untuk orang yang sedang kamu lepaskan. Kamu bisa membuat lebih dari satu.">
            <PrimaryButton label="Buat Pudar pertamamu" onPress={() => router.push('/profile/new')} />
          </EmptyState>
        </View>
      </Screen>
    );
  }
  // Keyed by profile so switching Pudars starts from that Pudar's own today.
  return <Day key={activeProfile.id} profile={activeProfile} />;
}

/** Today screen for one profile (PRD §6 Today). */
function Day({ profile }: { profile: Profile }) {
  const { db } = useDatabase();
  const today = useLocalToday();
  const [selected, setSelected] = useState(today);
  // The date the editor opened on. It stays writable after midnight until the draft is settled.
  const [writableDate, setWritableDate] = useState(today);

  const [quickLogs, setQuickLogs] = useState<QuickLogs>(NO_QUICK_LOGS);
  const [entry, setEntry] = useState<JournalEntry | null>(null);
  const [draft, setDraft] = useState('');
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [marks, setMarks] = useState<Map<LocalDate, DayMark>>(new Map());
  const [week, setWeek] = useState<{ from: LocalDate; to: LocalDate } | null>(null);
  const [acknowledged, setAcknowledged] = useState<boolean | null>(null);
  const [showNotice, setShowNotice] = useState(false);
  const editorRef = useRef<TextInput>(null);

  const writable = selected === writableDate;
  const baseline = entry?.content ?? '';
  const dirty = writable && draft !== baseline;

  // Midnight rule (PRD §6 Editor): move to the new today unless there's an unsaved draft.
  if (today !== writableDate && !dirty) {
    setWritableDate(today);
    setSelected(today);
  }

  useEffect(() => {
    getSetting(db, 'retention_ack_at').then((value) => setAcknowledged(value !== null));
  }, [db]);

  useEffect(() => {
    let cancelled = false;
    const now = Date.now();
    Promise.all([
      getQuickLogs(db, profile.id, selected),
      getEntryForDate(db, profile.id, selected, now),
    ]).then(([logs, found]) => {
      if (cancelled) return;
      setQuickLogs(logs);
      setEntry(found);
      setDraft(found?.content ?? '');
      setSavedAt(null);
    });
    return () => {
      cancelled = true;
    };
  }, [db, profile.id, selected]);

  const [marksVersion, setMarksVersion] = useState(0);
  useEffect(() => {
    if (!week) return;
    let cancelled = false;
    listEntryMarks(db, profile.id, week.from, week.to, Date.now()).then((found) => {
      if (!cancelled) setMarks(found);
    });
    return () => {
      cancelled = true;
    };
  }, [db, profile.id, week, marksVersion]);
  const onWeekChange = useCallback((from: LocalDate, to: LocalDate) => {
    setWeek((current) => (current?.from === from && current.to === to ? current : { from, to }));
  }, []);

  const toggle = async (key: QuickLogKey) => {
    const next = { ...quickLogs, [key]: !quickLogs[key] };
    setQuickLogs(next);
    await saveQuickLogs(db, profile.id, selected, next, Date.now());
  };

  const save = async () => {
    const now = Date.now();
    const saved = await saveEntry(db, profile.id, writableDate, draft, { id: Crypto.randomUUID(), now });
    setEntry(saved);
    setSavedAt(now);
    setMarksVersion((n) => n + 1);
  };

  const acknowledge = async () => {
    await setSetting(db, 'retention_ack_at', String(Date.now()));
    setAcknowledged(true);
    setShowNotice(false);
    setTimeout(() => editorRef.current?.focus(), 300);
  };

  const isToday = selected === today;
  const start = profile.noContactStartDate;
  const days = start && compareLocalDates(start, selected) <= 0 ? diffCalendarDays(start, selected) : null;
  const canSave = dirty && draft.trim().length > 0 && !(entry !== null && entry.content === null);

  return (
    <Screen>
      <ProfileSelector profile={profile} />
      <WeekStrip
        selected={selected}
        today={today}
        weekStartsOn={WEEK_STARTS_ON}
        marks={marks}
        onSelect={setSelected}
        onWeekChange={onWeekChange}
      />

      {start === null ? (
        <EmptyState
          icon={ICONS.leaf}
          title="Atur hari kamu memulai"
          body="Pilih tanggal kamu mulai tanpa kontak untuk melihat perjalananmu di sini.">
          <SecondaryButton
            label="Atur tanggal mulai"
            icon={ICONS.calendar}
            compact
            onPress={() => router.push({ pathname: '/profile/[id]', params: { id: profile.id } })}
          />
        </EmptyState>
      ) : days !== null ? (
        <Counter days={days} />
      ) : null}

      <AppText variant="heading" accessibilityRole="header" style={styles.sectionTitle}>
        {isToday || writable ? 'Apa yang kurasakan hari ini?' : 'Apa yang kurasakan hari itu?'}
      </AppText>
      <QuickLogButtons value={quickLogs} onToggle={toggle} readOnly={!writable} />

      {writable ? (
        <>
          <JournalEditor
            ref={editorRef}
            value={draft}
            onChange={setDraft}
            locked={acknowledged !== true}
            onLockedPress={() => acknowledged === false && setShowNotice(true)}
          />
          <PrimaryButton label="Simpan jurnalku" onPress={save} disabled={!canSave} />
          {savedAt !== null && !dirty && (
            <View style={styles.saved} accessibilityLiveRegion="polite">
              <Icon icon={ICONS.checkCircle} size={16} color={colors.selfGreenInk} />
              <AppText variant="caption">Baru saja tersimpan</AppText>
            </View>
          )}
        </>
      ) : (
        <PastDayCard date={selected} entry={entry} quickLogs={quickLogs} />
      )}

      <RetentionNotice visible={showNotice} onAcknowledge={acknowledge} />
    </Screen>
  );
}

/** Elapsed days only: not a streak or score (PRD §6 No-contact counter). */
function Counter({ days }: { days: number }) {
  const label = days === 0 ? 'Mulai hari ini' : `${days} hari`;
  return (
    <View style={styles.counter} accessible accessibilityLabel={`${label} tanpa kontak. Satu hari demi satu hari.`}>
      {days === 0 ? (
        <AppText style={styles.counterWord}>Mulai hari ini</AppText>
      ) : (
        <AppText style={styles.counterLine}>
          <AppText style={styles.counterNumber}>{days}</AppText>
          <AppText style={styles.counterWord}> hari</AppText>
        </AppText>
      )}
      <AppText variant="caption" style={styles.counterCaption}>
        tanpa kontak · Satu hari demi satu hari.
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  firstLaunch: {
    paddingTop: spacing.xxl,
  },
  counter: {
    alignItems: 'center',
    gap: spacing.xs,
    paddingTop: spacing.sm,
  },
  counterLine: {
    textAlign: 'center',
  },
  counterNumber: {
    fontFamily: fonts.serif,
    fontSize: 64,
    lineHeight: 72,
    color: colors.primaryInk,
  },
  counterWord: {
    fontFamily: fonts.serif,
    fontSize: 36,
    lineHeight: 72,
    color: colors.primaryInk,
  },
  counterCaption: {
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
  },
  sectionTitle: {
    marginTop: spacing.sm,
  },
  saved: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
});
