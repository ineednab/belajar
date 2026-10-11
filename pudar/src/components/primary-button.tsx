import { Pressable, type StyleProp, type ViewStyle } from 'react-native';

import type { IconSpec } from '@/theme/icons';

import { fonts } from '@/theme/typography';
import { radii, spacing } from '@/theme/tokens';
import { createStyles, useColors } from '@/theme/theme';

import { AppText } from './app-text';
import { Icon } from './icon';

export function PrimaryButton({
  label,
  onPress,
  disabled = false,
  destructive = false,
  icon,
  style,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  /** Red, for actions that can't be undone (Let Go's confirmation). */
  destructive?: boolean;
  icon?: IconSpec;
  style?: StyleProp<ViewStyle>;
}) {
  const styles = useStyles();
  const colors = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        destructive && styles.destructive,
        style,
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}>
      {icon && <Icon icon={icon} size={18} color={colors.onPrimaryInk} />}
      <AppText style={styles.label}>{label}</AppText>
    </Pressable>
  );
}

const useStyles = createStyles((colors) => ({
  button: {
    backgroundColor: colors.primaryInk,
    borderRadius: radii.pill,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  destructive: {
    backgroundColor: colors.dangerInk,
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
}));
