import { forwardRef } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { MAX_ENTRY_LENGTH } from '@/lib/fading';
import { colors, radii, spacing } from '@/theme/tokens';
import { typography } from '@/theme/typography';

import { AppText } from './app-text';

const formatCount = (n: number) => n.toLocaleString('en-US');

/**
 * Today's journal text box with a live character count (PRD §6 Journal editor). While `locked`
 * (the retention notice hasn't been acknowledged), tapping it calls `onLockedPress` instead.
 */
export const JournalEditor = forwardRef<
  TextInput,
  { value: string; onChange: (text: string) => void; locked: boolean; onLockedPress: () => void }
>(function JournalEditor({ value, onChange, locked, onLockedPress }, ref) {
  return (
    <View style={styles.box}>
      <TextInput
        ref={ref}
        value={value}
        onChangeText={onChange}
        editable={!locked}
        multiline
        maxLength={MAX_ENTRY_LENGTH}
        placeholder="Write what's on your mind…"
        placeholderTextColor={colors.mutedInk}
        accessibilityLabel="Journal entry"
        textAlignVertical="top"
        style={styles.input}
      />
      {locked && (
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onLockedPress}
          accessibilityRole="button"
          accessibilityLabel="Start writing"
        />
      )}
      <AppText variant="caption" style={styles.count}>
        {formatCount(value.length)} / {formatCount(MAX_ENTRY_LENGTH)}
      </AppText>
    </View>
  );
});

const styles = StyleSheet.create({
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
    fontSize: 15,
    lineHeight: 22,
    minHeight: 96,
    padding: 0,
  },
  count: {
    alignSelf: 'flex-end',
    fontSize: 12,
  },
});
