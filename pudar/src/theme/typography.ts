import { Fraunces_400Regular } from '@expo-google-fonts/fraunces';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
} from '@expo-google-fonts/inter';
import type { TextStyle } from 'react-native';

import { colors } from './tokens';

/** Passed to `useFonts` in the root layout. */
export const fontAssets = {
  Fraunces_400Regular,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
};

export const fonts = {
  serif: 'Fraunces_400Regular',
  sans: 'Inter_400Regular',
  sansMedium: 'Inter_500Medium',
  sansSemiBold: 'Inter_600SemiBold',
} as const;

export const typography = {
  display: { fontFamily: fonts.serif, fontSize: 48, lineHeight: 56, color: colors.text },
  title: { fontFamily: fonts.serif, fontSize: 30, lineHeight: 36, color: colors.text },
  heading: { fontFamily: fonts.serif, fontSize: 22, lineHeight: 28, color: colors.text },
  body: { fontFamily: fonts.sans, fontSize: 16, lineHeight: 24, color: colors.text },
  label: { fontFamily: fonts.sansMedium, fontSize: 15, lineHeight: 20, color: colors.text },
  caption: { fontFamily: fonts.sans, fontSize: 13, lineHeight: 18, color: colors.mutedInk },
} satisfies Record<string, TextStyle>;

export type TypographyVariant = keyof typeof typography;
