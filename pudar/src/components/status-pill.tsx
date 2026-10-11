import { StyleSheet, View } from 'react-native';

import type { FadeTone } from '@/lib/fade-label';
import { colors, radii, spacing } from '@/theme/tokens';
import { fonts } from '@/theme/typography';

import { AppText } from './app-text';

const TONES: Record<FadeTone, { bg: string; ink: string }> = {
  rose: { bg: colors.roseBg, ink: colors.primaryInk },
  peach: { bg: colors.peachBg, ink: colors.peachInk },
  neutral: { bg: colors.neutralBg, ink: colors.text },
};

export function StatusPill({ text, tone }: { text: string; tone: FadeTone }) {
  const { bg, ink } = TONES[tone];
  return (
    <View style={[styles.pill, { backgroundColor: bg }]}>
      <AppText style={[styles.text, { color: ink }]}>{text}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignSelf: 'flex-start',
    borderRadius: radii.pill,
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: spacing.xs,
  },
  text: {
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    lineHeight: 18,
  },
});
