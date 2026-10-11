import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { formatEntryTime } from '@/components/entry-list';
import { Icon } from '@/components/icon';
import { PrimaryButton } from '@/components/primary-button';
import { MoreQuickLogChips, QuickLogIcons } from '@/components/quick-logs';
import { SecondaryButton } from '@/components/secondary-button';
import { StatusPill } from '@/components/status-pill';
import { getQuickLogs, type QuickLogs } from '@/db/day-records';
import { getEntry, isFaded, letGoEntry, setEntryLocked, type JournalEntry } from '@/db/entries';
import { useDatabase } from '@/db/provider';
import { localDateToDate } from '@/lib/date';
import { fadeLabel } from '@/lib/fade-label';
import { getFadeState } from '@/lib/fading';
import { LOCALE } from '@/lib/locale';
import { ICONS } from '@/theme/icons';
import { colors, radii, spacing } from '@/theme/tokens';

type Loaded = { entry: JournalEntry; quickLogs: QuickLogs; now: number };

/**
 * Entry detail (PRD §6): readable text with no fading applied, or the locked or faded message.
 * Lock and Unlock (not on faded entries) and Let Go (always).
 */
export default function EntryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { db } = useDatabase();
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [version, setVersion] = useState(0);
  const [confirm, setConfirm] = useState<'unlock' | 'letGo' | null>(null);

  useEffect(() => {
    let cancelled = false;
    const now = Date.now();
    getEntry(db, id, now).then(async (entry) => {
      if (cancelled) return;
      if (!entry) {
        router.back();
        return;
      }
      const quickLogs = await getQuickLogs(db, entry.profileId, entry.date);
      if (!cancelled) setLoaded({ entry, quickLogs, now });
    });
    return () => {
      cancelled = true;
    };
  }, [db, id, version]);

  if (!loaded) return null;
  const { entry, quickLogs, now } = loaded;
  const state = getFadeState(entry, now);
  const label = fadeLabel(state);
  const faded = isFaded(entry);
  const title = localDateToDate(entry.date).toLocaleDateString(LOCALE, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const lock = async (locked: boolean) => {
    await setEntryLocked(db, entry.id, locked, Date.now());
    setConfirm(null);
    setVersion((n) => n + 1);
  };
  const letGo = async () => {
    await letGoEntry(db, entry.id);
    setConfirm(null);
    router.back();
  };

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <AppText variant="title" accessibilityRole="header" style={styles.title}>
          {title}
        </AppText>
        <View style={styles.meta}>
          <QuickLogIcons value={quickLogs} />
          <StatusPill text={label.text} tone={label.tone} />
          {entry.locked && <Icon icon={ICONS.lock} size={16} color={colors.mutedInk} />}
        </View>
        <MoreQuickLogChips value={quickLogs} align="start" />
        <AppText variant="caption">Ditulis pukul {formatEntryTime(entry.createdAt)}</AppText>

        {faded ? (
          <View style={styles.messageBox}>
            <AppText variant="heading" style={styles.center}>
              Tulisan ini sudah memudar.
            </AppText>
            <AppText variant="caption" style={styles.center}>
              Kata-katanya sudah terhapus. Tanggal dan catatan perasaan hari itu tetap ada.
            </AppText>
          </View>
        ) : entry.locked ? (
          <View style={styles.messageBox}>
            <View style={styles.lockCircle}>
              <Icon icon={ICONS.lock} size={22} color={colors.primaryInk} />
            </View>
            <AppText variant="heading" style={styles.center}>
              Tulisan ini dikunci.
            </AppText>
            <AppText variant="caption" style={[styles.center, styles.lockedBody]}>
              Kata-katamu disembunyikan, sementara waktu terus berjalan.
            </AppText>
          </View>
        ) : (
          <AppText variant="body" style={styles.contentText} selectable>
            {entry.content}
          </AppText>
        )}
      </ScrollView>

      <View style={styles.actions}>
        {!faded && (
          <SecondaryButton
            label={entry.locked ? 'Buka kunci' : 'Kunci'}
            icon={entry.locked ? ICONS.lockOpen : ICONS.lock}
            onPress={() => (entry.locked ? setConfirm('unlock') : lock(true))}
            style={styles.action}
          />
        )}
        <PrimaryButton label="Lepaskan" icon={ICONS.letGo} onPress={() => setConfirm('letGo')} style={styles.action} />
      </View>

      <ConfirmDialog
        visible={confirm === 'unlock'}
        title="Buka kunci tulisan ini?"
        body="Membuka kunci tidak memperlambat atau membatalkan pudarnya."
        confirmLabel="Buka kunci"
        onConfirm={() => lock(false)}
        onCancel={() => setConfirm(null)}
      />
      <ConfirmDialog
        visible={confirm === 'letGo'}
        title="Kamu yakin sudah siap melepaskan ini?"
        body="Tulisan ini akan dihapus selamanya dan tidak bisa dikembalikan. Catatan perasaan hari itu tetap ada."
        confirmLabel="Lepaskan"
        destructive
        onConfirm={letGo}
        onCancel={() => setConfirm(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  title: {
    fontSize: 26,
    lineHeight: 32,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  contentText: {
    marginTop: spacing.sm,
    fontSize: 17,
    lineHeight: 27,
  },
  messageBox: {
    marginTop: spacing.sm,
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  lockCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.roseBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  center: {
    textAlign: 'center',
  },
  lockedBody: {
    fontSize: 15,
    lineHeight: 22,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
  },
  action: {
    flex: 1,
  },
});
