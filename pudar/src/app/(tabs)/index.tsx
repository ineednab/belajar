import * as Crypto from 'expo-crypto';
import { getCalendars } from 'expo-localization';
import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, AppState, Pressable, StyleSheet, View, type TextInput } from 'react-native';

import { AppText } from '@/components/app-text';
import { ClosedBanner } from '@/components/closed-banner';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { EmptyState } from '@/components/empty-state';
import { EntryList, formatEntryTime } from '@/components/entry-list';
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
import { deleteDraft, getDraft, saveDraft } from '@/db/drafts';
import { getQuickLogs, NO_QUICK_LOGS, saveQuickLogs, type QuickLogKey, type QuickLogs } from '@/db/day-records';
import {
  createEntry,
  listEntriesForDate,
  listEntryMarks,
  updateEntry,
  type JournalEntry,
} from '@/db/entries';
import { isClosed, type Profile } from '@/db/profiles';
import type { Db } from '@/db/types';
import { useDatabase } from '@/db/provider';
import { getSetting, setSetting } from '@/db/settings';
import { useLocalToday } from '@/hooks/use-local-today';
import { compareLocalDates, diffCalendarDays, weekStartsOnFromLocale, type LocalDate } from '@/lib/date';
import { TextButton } from '@/components/profile-form';
import { useProfiles } from '@/profiles/provider';
import { ICONS } from '@/theme/icons';
import { colors, radii, spacing } from '@/theme/tokens';
import { fonts } from '@/theme/typography';

const WEEK_STARTS_ON = weekStartsOnFromLocale(getCalendars()[0]?.firstWeekday);
const DRAFT_DEBOUNCE_MS = 1000;

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
  const { db, purgeVersion } = useDatabase();
  const today = useLocalToday();
  const [selected, setSelected] = useState(today);
  // The date the editor opened on. It stays writable after midnight until the draft is settled.
  const [writableDate, setWritableDate] = useState(today);

  const [quickLogs, setQuickLogs] = useState<QuickLogs>(NO_QUICK_LOGS);
  // Entries of the selected day, and of the day the editor writes to (often the same day).
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [writableEntries, setWritableEntries] = useState<JournalEntry[]>([]);
  // The entry being edited, or null while writing a new one (PRD D5).
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  // False until the autosaved draft has been restored, so autosave can't overwrite it first.
  const [draftReady, setDraftReady] = useState(false);
  const [stripKey, setStripKey] = useState(0);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [marks, setMarks] = useState<Map<LocalDate, DayMark>>(new Map());
  const [week, setWeek] = useState<{ from: LocalDate; to: LocalDate } | null>(null);
  const [acknowledged, setAcknowledged] = useState<boolean | null>(null);
  const [showNotice, setShowNotice] = useState(false);
  const editorRef = useRef<TextInput>(null);

  // A closed Pudar is read-only history (PRD D23).
  const closed = isClosed(profile);
  const writable = !closed && selected === writableDate;
  const { close } = useProfiles();
  const [confirmClose, setConfirmClose] = useState(false);
  const editing = editingId === null ? null : (writableEntries.find((e) => e.id === editingId) ?? null);
  const baseline = editing?.content ?? '';
  const dirty = draftReady && draft !== baseline;

  // Midnight rule (PRD §6 Editor): move to the new today unless there's an unsaved draft.
  if (today !== writableDate && !dirty) {
    setWritableDate(today);
    setSelected(today);
  }

  useEffect(() => {
    getSetting(db, 'retention_ack_at').then((value) => setAcknowledged(value !== null));
  }, [db]);

  // Restore this Pudar's autosaved draft (PRD D21). A draft from an earlier day comes back as a
  // new entry for today, since that day is no longer writable; an unsaved edit of an old entry
  // can't be applied anymore and is dropped.
  useEffect(() => {
    let cancelled = false;
    getDraft(db, profile.id, Date.now()).then(async (found) => {
      if (cancelled) return;
      if (found && (found.date === today || found.entryId === null)) {
        setEditingId(found.date === today ? found.entryId : null);
        setDraft(found.content);
      } else if (found) {
        await deleteDraft(db, profile.id);
      }
      setDraftReady(true);
    });
    return () => {
      cancelled = true;
    };
    // Only on mount: `today` changing later is handled by the midnight rule.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db, profile.id]);

  // Autosave about a second after typing stops, and right away when the app goes to the
  // background or this Pudar is left (PRD D21).
  const pendingDraft = useRef<(() => void) | null>(null);
  useEffect(() => {
    if (!draftReady) return;
    const write = () => {
      pendingDraft.current = null;
      if (dirty) {
        saveDraft(db, { profileId: profile.id, date: writableDate, entryId: editingId, content: draft }, Date.now());
      } else {
        deleteDraft(db, profile.id);
      }
    };
    pendingDraft.current = write;
    const timer = setTimeout(write, DRAFT_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [db, profile.id, draftReady, dirty, draft, editingId, writableDate]);
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active') pendingDraft.current?.();
    });
    return () => {
      subscription.remove();
      pendingDraft.current?.();
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const now = Date.now();
    Promise.all([
      getQuickLogs(db, profile.id, selected),
      listEntriesForDate(db, profile.id, selected, now),
    ]).then(([logs, found]) => {
      if (cancelled) return;
      setQuickLogs(logs);
      setEntries(found);
      setSavedAt(null);
    });
    return () => {
      cancelled = true;
    };
  }, [db, profile.id, selected, purgeVersion]);

  useEffect(() => {
    let cancelled = false;
    listEntriesForDate(db, profile.id, writableDate, Date.now()).then((found) => {
      if (!cancelled) setWritableEntries(found);
    });
    return () => {
      cancelled = true;
    };
  }, [db, profile.id, writableDate, purgeVersion]);

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
  }, [db, profile.id, week, marksVersion, purgeVersion]);
  const onWeekChange = useCallback((from: LocalDate, to: LocalDate) => {
    setWeek((current) => (current?.from === from && current.to === to ? current : { from, to }));
  }, []);

  const toggle = async (key: QuickLogKey) => {
    const next = { ...quickLogs, [key]: !quickLogs[key] };
    setQuickLogs(next);
    await saveQuickLogs(db, profile.id, selected, next, Date.now());
  };

  const save = async () => {
    const saved = await persistEntry(db, profile.id, writableDate, editing?.id ?? null, draft);
    const apply = (list: JournalEntry[]) =>
      editing ? list.map((e) => (e.id === saved.id ? saved : e)) : [saved, ...list];
    setWritableEntries(apply);
    if (selected === writableDate) setEntries(apply);
    // The words are an entry now, so the draft goes at once rather than after the debounce.
    pendingDraft.current = null;
    await deleteDraft(db, profile.id);
    // Saving clears the editor for the next entry (PRD D5).
    setEditingId(null);
    setDraft('');
    setSavedAt(saved.updatedAt);
    setMarksVersion((n) => n + 1);
  };

  const startEditing = (next: JournalEntry | null) => {
    const open = () => {
      setEditingId(next?.id ?? null);
      setDraft(next?.content ?? '');
      setSavedAt(null);
    };
    if (!dirty) {
      open();
      return;
    }
    // There's one draft per Pudar, so opening another entry would replace the unsaved text.
    Alert.alert('Tulisanmu belum disimpan', 'Kalau pindah sekarang, tulisan yang belum disimpan akan hilang.', [
      { text: 'Tetap menulis', style: 'cancel' },
      { text: 'Buang tulisan', style: 'destructive', onPress: open },
    ]);
  };

  const acknowledge = async () => {
    await setSetting(db, 'retention_ack_at', String(Date.now()));
    setAcknowledged(true);
    setShowNotice(false);
    setTimeout(() => editorRef.current?.focus(), 300);
  };

  const isToday = selected === today;
  // The "Hari ini" pill shows on a past day, or while an earlier week is in view (PRD §6).
  const awayFromToday = selected !== writableDate || (week !== null && compareLocalDates(week.to, writableDate) < 0);
  const goToToday = () => {
    setSelected(writableDate);
    // Remounting the strip brings today's week back into view even if today was already selected.
    setStripKey((n) => n + 1);
  };
  const start = profile.noContactStartDate;
  // Once closed, the counter stops on the day it was closed.
  const counterDate =
    profile.closedOn && compareLocalDates(profile.closedOn, selected) < 0 ? profile.closedOn : selected;
  const days = start && compareLocalDates(start, counterDate) <= 0 ? diffCalendarDays(start, counterDate) : null;
  const canSave = dirty && draft.trim().length > 0;

  return (
    <Screen>
      <View style={styles.header}>
        <ProfileSelector profile={profile} />
        {awayFromToday && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Kembali ke hari ini"
            onPress={goToToday}
            hitSlop={8}
            style={({ pressed }) => [styles.todayPill, pressed && styles.pressed]}>
            <AppText style={styles.todayPillText}>Hari ini</AppText>
          </Pressable>
        )}
      </View>
      <WeekStrip
        key={stripKey}
        selected={selected}
        today={today}
        weekStartsOn={WEEK_STARTS_ON}
        marks={marks}
        onSelect={setSelected}
        onWeekChange={onWeekChange}
      />

      {start === null && !closed ? (
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

      {closed && <ClosedBanner profile={profile} />}

      <AppText variant="heading" accessibilityRole="header" style={styles.sectionTitle}>
        {isToday || writable ? 'Apa yang kurasakan hari ini?' : 'Apa yang kurasakan hari itu?'}
      </AppText>
      <QuickLogButtons value={quickLogs} onToggle={toggle} readOnly={!writable} />

      {writable ? (
        <>
          {editing && (
            <View style={styles.editingBar}>
              <AppText variant="caption" style={styles.editingText}>
                Mengubah tulisan pukul {formatEntryTime(editing.createdAt)}
              </AppText>
              <Pressable accessibilityRole="button" onPress={() => startEditing(null)} hitSlop={8}>
                <AppText variant="label" style={styles.editingCancel}>
                  Tulis yang baru
                </AppText>
              </Pressable>
            </View>
          )}
          <JournalEditor
            ref={editorRef}
            value={draft}
            onChange={setDraft}
            locked={acknowledged !== true}
            onLockedPress={() => acknowledged === false && setShowNotice(true)}
          />
          <PrimaryButton
            label={editing ? 'Simpan perubahan' : 'Simpan jurnalku'}
            onPress={save}
            disabled={!canSave}
          />
          {savedAt !== null && !dirty && (
            <View style={styles.saved} accessibilityLiveRegion="polite">
              <Icon icon={ICONS.checkCircle} size={16} color={colors.selfGreenInk} />
              <AppText variant="caption">Baru saja tersimpan</AppText>
            </View>
          )}
          {dirty ? (
            <AppText variant="caption" style={styles.note}>
              Draf disimpan otomatis, jadi tulisanmu aman walau aplikasi tertutup.
            </AppText>
          ) : (
            !editing && (
              <AppText variant="caption" style={styles.note}>
                Kamu bisa menulis lebih dari sekali hari ini.
              </AppText>
            )
          )}
          {writableEntries.length > 0 && (
            <View style={styles.todayEntries}>
              <AppText variant="label">
                {isToday ? 'Tulisan hari ini' : 'Tulisan hari itu'} · {writableEntries.length}
              </AppText>
              <EntryList entries={writableEntries} editingId={editingId} onPress={startEditing} numberOfLines={3} />
            </View>
          )}
        </>
      ) : (
        <PastDayCard date={selected} entries={entries} quickLogs={quickLogs} />
      )}

      {!closed && (
        <View style={styles.closeAction}>
          <TextButton label="Aku sudah selesai dengan orang ini" onPress={() => setConfirmClose(true)} />
        </View>
      )}

      <RetentionNotice visible={showNotice} onAcknowledge={acknowledge} />
      <ConfirmDialog
        visible={confirmClose}
        title={`Sudah selesai dengan ${profile.name}?`}
        body="Pudar ini akan jadi riwayat yang hanya bisa dibaca: tidak ada tulisan atau catatan perasaan baru, dan hitungan harinya berhenti. Tulisan yang ada tetap memudar sesuai waktunya. Kamu bisa membukanya lagi kapan saja dari Ubah Pudar."
        confirmLabel="Ya, aku sudah selesai"
        onConfirm={async () => {
          setConfirmClose(false);
          await close(profile.id);
        }}
        onCancel={() => setConfirmClose(false)}
      />
    </Screen>
  );
}

/** Saves the editor: a new entry for the day, or the edited one. */
function persistEntry(
  db: Db,
  profileId: string,
  date: LocalDate,
  editingId: string | null,
  content: string,
): Promise<JournalEntry> {
  const now = Date.now();
  return editingId
    ? updateEntry(db, editingId, content, now)
    : createEntry(db, profileId, date, content, { id: Crypto.randomUUID(), now });
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  todayPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.primaryInk,
    backgroundColor: colors.surface,
  },
  todayPillText: {
    fontFamily: fonts.sansMedium,
    fontSize: 14,
    lineHeight: 18,
    color: colors.primaryInk,
  },
  pressed: {
    opacity: 0.7,
  },
  note: {
    textAlign: 'center',
  },
  closeAction: {
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  editingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  editingText: {
    flexShrink: 1,
  },
  editingCancel: {
    color: colors.primaryInk,
  },
  todayEntries: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  saved: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
});
