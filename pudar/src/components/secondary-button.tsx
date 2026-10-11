import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import type { IconSpec } from '@/theme/icons';
import { fonts } from '@/theme/typography';
import { colors, radii, spacing } from '@/theme/tokens';

import { AppText } from './app-text';
import { Icon } from './icon';

/** Outlined pill for secondary actions ("Set start date", "+ New Pudar"). */
export function SecondaryButton({
  label,
  onPress,
  icon,
  compact = false,
  style,
}: {
  label: string;
  onPress: () => void;
  icon?: IconSpec;
  /** Hug the label instead of filling the row. */
  compact?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.button, compact && styles.compact, style, pressed && styles.pressed]}>
      {icon && <Icon icon={icon} size={16} color={colors.primaryInk} />}
      <AppText style={styles.label}>{label}</AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm + 4,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.surface,
  },
  compact: {
    alignSelf: 'center',
  },
  pressed: {
    opacity: 0.6,
  },
  label: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 15,
    color: colors.primaryInk,
  },
});
