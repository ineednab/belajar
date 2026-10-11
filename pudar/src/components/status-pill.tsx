import { View } from 'react-native';

import type { FadeTone } from '@/lib/fade-label';
import { radii, spacing, type ColorTokens } from '@/theme/tokens';
import { createStyles, useColors } from '@/theme/theme';
import { fonts } from '@/theme/typography';

import { AppText } from './app-text';

function toneColors(colors: ColorTokens, tone: FadeTone): { bg: string; ink: string } {
  switch (tone) {
    case 'rose':
      return { bg: colors.roseBg, ink: colors.primaryInk };
    case 'peach':
      return { bg: colors.peachBg, ink: colors.peachInk };
    case 'neutral':
      return { bg: colors.neutralBg, ink: colors.text };
  }
}

export function StatusPill({ text, tone }: { text: string; tone: FadeTone }) {
  const styles = useStyles();
  const { bg, ink } = toneColors(useColors(), tone);
  return (
    <View style={[styles.pill, { backgroundColor: bg }]}>
      <AppText style={[styles.text, { color: ink }]}>{text}</AppText>
    </View>
  );
}

const useStyles = createStyles((colors) => ({
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
}));
