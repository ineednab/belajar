import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import type { IconSpec } from '@/theme/icons';
import { ICONS } from '@/theme/icons';
import { colors, radii, spacing } from '@/theme/tokens';

import { AppText } from './app-text';
import { Icon } from './icon';

/** A titled group of rows on the Settings tab. */
export function SettingsSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <AppText variant="caption" style={styles.sectionTitle} accessibilityRole="header">
        {title.toUpperCase()}
      </AppText>
      <View style={styles.card}>{children}</View>
    </View>
  );
}

/**
 * One tappable row: an icon (or any leading element), a label, optional trailing content and a
 * chevron. Rows after the first get a divider.
 */
export function SettingsRow({
  label,
  icon,
  leading,
  trailing,
  destructive = false,
  chevron = true,
  first = false,
  accessibilityLabel,
  onPress,
}: {
  label: string;
  icon?: IconSpec;
  leading?: ReactNode;
  trailing?: ReactNode;
  destructive?: boolean;
  chevron?: boolean;
  first?: boolean;
  accessibilityLabel?: string;
  onPress: () => void;
}) {
  const ink = destructive ? colors.dangerInk : colors.text;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      onPress={onPress}
      style={({ pressed }) => [styles.row, !first && styles.divider, pressed && styles.pressed]}>
      {leading ?? (icon && <Icon icon={icon} size={20} color={destructive ? colors.dangerInk : colors.primaryInk} />)}
      <AppText variant="label" style={[styles.label, { color: ink }]} numberOfLines={1}>
        {label}
      </AppText>
      {trailing}
      {chevron && <Icon icon={ICONS.chevronRight} size={16} color={colors.mutedInk} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    letterSpacing: 0.5,
    marginLeft: spacing.xs,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 56,
    paddingVertical: spacing.sm + 4,
  },
  divider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  pressed: {
    opacity: 0.6,
  },
  label: {
    flex: 1,
  },
});
