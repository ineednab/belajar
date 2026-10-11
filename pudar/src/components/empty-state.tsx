import type { ReactNode } from 'react';
import { View } from 'react-native';

import type { IconSpec } from '@/theme/icons';
import { spacing } from '@/theme/tokens';
import { createStyles, useColors } from '@/theme/theme';

import { AppText } from './app-text';
import { Icon } from './icon';

/** Centered icon, serif title, short explanation and one action. */
export function EmptyState({
  icon,
  title,
  body,
  children,
}: {
  icon: IconSpec;
  title: string;
  body: string;
  children?: ReactNode;
}) {
  const styles = useStyles();
  const colors = useColors();
  return (
    <View style={styles.container}>
      <View style={styles.iconCircle} accessible={false} importantForAccessibility="no-hide-descendants">
        <Icon icon={icon} size={36} color={colors.primaryInk} />
      </View>
      <AppText variant="heading" style={styles.center} accessibilityRole="header">
        {title}
      </AppText>
      <AppText variant="caption" style={[styles.center, styles.body]}>
        {body}
      </AppText>
      {children && <View style={styles.action}>{children}</View>}
    </View>
  );
}

const useStyles = createStyles((colors) => ({
  container: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  center: {
    textAlign: 'center',
  },
  body: {
    maxWidth: 280,
    fontSize: 15,
    lineHeight: 21,
  },
  action: {
    alignSelf: 'stretch',
    marginTop: spacing.md,
  },
}));
