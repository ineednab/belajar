import type { ReactNode } from 'react';
import { Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { spacing } from '@/theme/tokens';
import { createStyles } from '@/theme/theme';

export function Screen({ children }: { children: ReactNode }) {
  const styles = useStyles();
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled">
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

const useStyles = createStyles((colors) => ({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.lg,
    // On web the tabs float over the top of the page instead of sitting at the bottom.
    paddingTop: Platform.OS === 'web' ? 88 : spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },
}));
