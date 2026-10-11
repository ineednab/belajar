import { Pressable, StyleSheet, View } from 'react-native';

import { isFaded, type JournalEntry } from '@/db/entries';
import { LOCALE } from '@/lib/locale';
import { ICONS } from '@/theme/icons';
import { radii, spacing } from '@/theme/tokens';
import { createStyles, useColors } from '@/theme/theme';

import { AppText } from './app-text';
import { Icon } from './icon';

export const formatEntryTime = (timestamp: number) =>
  new Date(timestamp).toLocaleTimeString(LOCALE, { hour: '2-digit', minute: '2-digit' });

/**
 * A day's entries, newest first, each with the time it was written (PRD D5). Locked and faded
 * text is never shown. With `onPress`, entries that can still be edited are tappable.
 */
export function EntryList({
  entries,
  editingId = null,
  onPress,
  numberOfLines,
}: {
  entries: JournalEntry[];
  editingId?: string | null;
  onPress?: (entry: JournalEntry) => void;
  /** Clamp each entry's text, e.g. on Today where the editor matters more. */
  numberOfLines?: number;
}) {
  const styles = useStyles();
  const colors = useColors();
  return (
    <View style={styles.list}>
      {entries.map((entry) => {
        const time = formatEntryTime(entry.createdAt);
        const editable = onPress !== undefined && !isFaded(entry) && !entry.locked;
        const editing = entry.id === editingId;
        return (
          <Pressable
            key={entry.id}
            disabled={!editable}
            onPress={() => onPress?.(entry)}
            accessibilityRole={editable ? 'button' : undefined}
            accessibilityHint={editable ? 'Ketuk untuk mengubah tulisan ini' : undefined}
            accessibilityState={editable ? { selected: editing } : undefined}
            style={({ pressed }) => [styles.item, editing && styles.editing, pressed && styles.pressed]}>
            <View style={styles.header}>
              <AppText variant="caption" style={styles.time}>
                {time}
              </AppText>
              {entry.locked && <Icon icon={ICONS.lock} size={12} color={colors.mutedInk} />}
              {editing && (
                <AppText variant="caption" style={styles.editingLabel}>
                  Sedang diubah
                </AppText>
              )}
            </View>
            {isFaded(entry) ? (
              <AppText variant="caption" style={styles.state}>
                Tulisan ini sudah memudar.
              </AppText>
            ) : entry.locked ? (
              <AppText variant="caption" style={styles.state}>
                Tulisan ini dikunci. Kata-katamu disembunyikan, sementara waktu terus berjalan.
              </AppText>
            ) : (
              <AppText variant="body" style={styles.content} numberOfLines={numberOfLines}>
                {entry.content}
              </AppText>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

const useStyles = createStyles((colors) => ({
  list: {
    gap: spacing.sm,
  },
  item: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.xs,
  },
  editing: {
    borderWidth: 1.5,
    borderColor: colors.primaryInk,
  },
  pressed: {
    opacity: 0.7,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  time: {
    fontSize: 12,
  },
  editingLabel: {
    marginLeft: 'auto',
    fontSize: 12,
    color: colors.primaryInk,
  },
  state: {
    fontSize: 15,
    lineHeight: 22,
  },
  content: {
    fontSize: 15,
    lineHeight: 22,
  },
}));
