import { StyleSheet, View } from 'react-native';

import type { QuickLogs } from '@/db/day-records';
import type { JournalEntry } from '@/db/entries';
import { localDateToDate, type LocalDate } from '@/lib/date';
import { LOCALE } from '@/lib/locale';
import { ICONS } from '@/theme/icons';
import { radii, spacing } from '@/theme/tokens';
import { createStyles, useColors } from '@/theme/theme';

import { AppText } from './app-text';
import { EntryList } from './entry-list';
import { Icon } from './icon';
import { QuickLogIcons } from './quick-logs';

/** A past day on Today: read-only, and locked or faded text is never shown (PRD §6, D8). */
export function PastDayCard({
  date,
  entries,
  quickLogs,
}: {
  date: LocalDate;
  entries: JournalEntry[];
  quickLogs: QuickLogs;
}) {
  const styles = useStyles();
  const colors = useColors();
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
      {entries.length === 0 ? (
        <AppText variant="caption" style={styles.state}>
          Tidak ada tulisan hari itu.
        </AppText>
      ) : (
        <EntryList entries={entries} />
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

const useStyles = createStyles((colors) => ({
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
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  footerText: {
    fontSize: 12,
  },
}));
