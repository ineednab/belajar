import { Fraunces_400Regular } from '@expo-google-fonts/fraunces';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
} from '@expo-google-fonts/inter';
import type { TextStyle } from 'react-native';

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

/** Sizes and fonts. `AppText` adds the color for the current palette (captions use `mutedInk`). */
export const typography = {
  display: { fontFamily: fonts.serif, fontSize: 48, lineHeight: 56 },
  title: { fontFamily: fonts.serif, fontSize: 30, lineHeight: 36 },
  heading: { fontFamily: fonts.serif, fontSize: 22, lineHeight: 28 },
  body: { fontFamily: fonts.sans, fontSize: 16, lineHeight: 24 },
  label: { fontFamily: fonts.sansMedium, fontSize: 15, lineHeight: 20 },
  caption: { fontFamily: fonts.sans, fontSize: 13, lineHeight: 18 },
} satisfies Record<string, TextStyle>;

export type TypographyVariant = keyof typeof typography;
