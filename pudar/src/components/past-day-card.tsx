import { StyleSheet, View } from 'react-native';

import type { QuickLogs } from '@/db/day-records';
import type { JournalEntry } from '@/db/entries';
import { localDateToDate, type LocalDate } from '@/lib/date';
import { LOCALE } from '@/lib/locale';
import { ICONS } from '@/theme/icons';
import { colors, radii, spacing } from '@/theme/tokens';

import { AppText } from './app-text';
import { Icon } from './icon';
import { QuickLogIcons } from './quick-logs';

/** A past day on Today: read-only, and locked or faded text is never shown (PRD §6, D8). */
export function PastDayCard({
  date,
  entry,
  quickLogs,
}: {
  date: LocalDate;
  entry: JournalEntry | null;
  quickLogs: QuickLogs;
}) {
  const title = localDateToDate(date).toLocaleDateString(LOCALE, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  return (
    <View style={styles.card}>
      <AppText variant="label">{title}</AppText>
      <QuickLogIcons value={quickLogs} />
      {entry === null ? (
        <AppText variant="caption" style={styles.state}>
          Tidak ada tulisan hari itu.
        </AppText>
      ) : entry.content === null ? (
        <AppText variant="caption" style={styles.state}>
          Tulisan ini sudah memudar.
        </AppText>
      ) : entry.locked ? (
        <AppText variant="caption" style={styles.state}>
          Tulisan ini dikunci. Kata-katamu disembunyikan, sementara waktu terus berjalan.
        </AppText>
      ) : (
        <AppText variant="body" style={styles.content}>
          {entry.content}
        </AppText>
      )}
      <View style={styles.footer}>
        <Icon icon={ICONS.lock} size={12} color={colors.mutedInk} />
        <AppText variant="caption" style={styles.footerText}>
          Tulisan lama hanya bisa dibaca.
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm + 4,
  },
  state: {
    fontSize: 15,
    lineHeight: 22,
  },
  content: {
    fontSize: 15,
    lineHeight: 22,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  footerText: {
    fontSize: 12,
  },
});
