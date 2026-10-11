import { forwardRef } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { MAX_ENTRY_LENGTH } from '@/lib/fading';
import { LOCALE } from '@/lib/locale';
import { radii, spacing } from '@/theme/tokens';
import { createStyles, useColors } from '@/theme/theme';
import { typography } from '@/theme/typography';

import { AppText } from './app-text';

const formatCount = (n: number) => n.toLocaleString(LOCALE);

/**
 * Today's journal text box with a live character count (PRD §6 Journal editor). While `locked`
 * (the retention notice hasn't been acknowledged), tapping it calls `onLockedPress` instead.
 */
export const JournalEditor = forwardRef<
  TextInput,
  { value: string; onChange: (text: string) => void; locked: boolean; onLockedPress: () => void }
>(function JournalEditor({ value, onChange, locked, onLockedPress }, ref) {
  const styles = useStyles();
  const colors = useColors();
  return (
    <View style={styles.box}>
      <TextInput
        ref={ref}
        value={value}
        onChangeText={onChange}
        editable={!locked}
        multiline
        maxLength={MAX_ENTRY_LENGTH}
        placeholder="Tulis apa yang ada di pikiranmu…"
        placeholderTextColor={colors.mutedInk}
        accessibilityLabel="Tulisan jurnal"
        textAlignVertical="top"
        style={styles.input}
      />
      {locked && (
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onLockedPress}
          accessibilityRole="button"
          accessibilityLabel="Mulai menulis"
        />
      )}
      <AppText variant="caption" style={styles.count}>
        {formatCount(value.length)} / {formatCount(MAX_ENTRY_LENGTH)}
      </AppText>
    </View>
  );
});

const useStyles = createStyles((colors) => ({
  box: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  input: {
    ...typography.body,
    color: colors.text,
    fontSize: 15,
    lineHeight: 22,
    minHeight: 96,
    padding: 0,
  },
  count: {
    alignSelf: 'flex-end',
    fontSize: 12,
  },
}));
