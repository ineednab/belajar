import { Pressable, StyleSheet } from 'react-native';

import { fonts } from '@/theme/typography';
import { colors, radii, spacing } from '@/theme/tokens';

import { AppText } from './app-text';

export function PrimaryButton({
  label,
  onPress,
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}>
      <AppText style={styles.label}>{label}</AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.primaryInk,
    borderRadius: radii.pill,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  pressed: {
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.4,
  },
  label: {
    fontFamily: fonts.sansSemiBold,
    color: colors.onPrimaryInk,
  },
});
