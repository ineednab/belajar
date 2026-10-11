import { Pressable, StyleSheet, View } from 'react-native';

import type { QuickLogs } from '@/db/day-records';
import type { JournalEntry } from '@/db/entries';
import { localDateToDate } from '@/lib/date';
import { fadeLabel } from '@/lib/fade-label';
import { getFadeState } from '@/lib/fading';
import { LOCALE } from '@/lib/locale';
import { ICONS } from '@/theme/icons';
import { colors, radii, spacing } from '@/theme/tokens';

import { AppText } from './app-text';
import { formatEntryTime } from './entry-list';
import { Icon } from './icon';
import { QuickLogIcons } from './quick-logs';
import { StatusPill } from './status-pill';

/**
 * One entry on the Memory timeline (PRD §6 Memory timeline). Metadata only: never a text
 * preview, whatever the status. The card fades with the entry, down to 40%.
 */
export function TimelineCard({
  entry,
  quickLogs,
  isToday,
  now,
  onPress,
}: {
  entry: JournalEntry;
  quickLogs: QuickLogs | undefined;
  isToday: boolean;
  now: number;
  onPress: () => void;
}) {
  const state = getFadeState(entry, now);
  const label = fadeLabel(state);
  const date = localDateToDate(entry.date);
  const day = `${date.getDate()} ${date.toLocaleDateString(LOCALE, { month: 'short' }).replace('.', '')}`;
  const when = [day.toUpperCase(), isToday ? 'HARI INI' : null, formatEntryTime(entry.createdAt)]
    .filter(Boolean)
    .join(' · ');

  return (
    <View style={styles.row}>
      <View style={styles.rail}>
        <View style={styles.line} />
        <View style={[styles.dot, isToday && styles.dotToday]} />
      </View>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`${date.toLocaleDateString(LOCALE, { day: 'numeric', month: 'long' })}, ${formatEntryTime(entry.createdAt)}. ${label.text}${entry.locked ? '. Dikunci' : ''}`}
        accessibilityHint="Buka tulisan ini"
        style={({ pressed }) => [styles.card, { opacity: state.opacity * (pressed ? 0.8 : 1) }]}>
        <View style={styles.top}>
          <AppText variant="caption" style={styles.when}>
            {when}
          </AppText>
          <Icon icon={ICONS.chevronRight} size={16} color={colors.mutedInk} />
        </View>
        <View style={styles.bottom}>
          {quickLogs && <QuickLogIcons value={quickLogs} />}
          <View style={styles.status}>
            {entry.locked && <Icon icon={ICONS.lock} size={14} color={colors.mutedInk} />}
            <StatusPill text={label.text} tone={label.tone} />
          </View>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  rail: {
    width: 16,
    alignItems: 'center',
  },
  line: {
    position: 'absolute',
    top: -spacing.sm,
    bottom: -spacing.sm,
    width: 1.5,
    backgroundColor: colors.border,
  },
  dot: {
    marginTop: 22,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: colors.background,
  },
  dotToday: {
    borderColor: colors.primaryInk,
    borderWidth: 3,
  },
  card: {
    flex: 1,
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingVertical: spacing.sm + 4,
    paddingHorizontal: spacing.md,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  when: {
    flex: 1,
    fontSize: 12,
    letterSpacing: 0.5,
  },
  bottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: spacing.sm,
    minHeight: 32,
  },
  status: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
});
