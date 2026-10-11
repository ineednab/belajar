import type { ReactNode } from 'react';
import { ScrollView, View } from 'react-native';

import { spacing } from '@/theme/tokens';
import { createStyles } from '@/theme/theme';

import { AppText } from './app-text';

/** A calm, scrollable reading page under Settings (fading, privacy, support). */
export function InfoPage({ title, children }: { title: string; children: ReactNode }) {
  const styles = useStyles();
  return (
    <ScrollView
      style={styles.page}
      contentContainerStyle={styles.content}
      contentInsetAdjustmentBehavior="automatic">
      <AppText variant="title" accessibilityRole="header" style={styles.title}>
        {title}
      </AppText>
      {children}
    </ScrollView>
  );
}

/** A heading with its paragraphs. */
export function InfoSection({ title, children }: { title: string; children: ReactNode }) {
  const styles = useStyles();
  return (
    <View style={styles.section}>
      <AppText variant="heading" accessibilityRole="header" style={styles.sectionTitle}>
        {title}
      </AppText>
      {children}
    </View>
  );
}

export function Paragraph({ children }: { children: ReactNode }) {
  return <AppText variant="body">{children}</AppText>;
}

const useStyles = createStyles((colors) => ({
  page: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.lg,
  },
  title: {
    fontSize: 26,
    lineHeight: 32,
  },
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: 19,
    lineHeight: 25,
  },
}));
