import { StyleSheet, useColorScheme } from 'react-native';

import { darkColors, lightColors, type ColorTokens } from './tokens';

export type ColorSchemeName = 'light' | 'dark';

/** The system appearance (PRD §8: light and dark mode follow the system setting). */
export function useColorSchemeName(): ColorSchemeName {
  return useColorScheme() === 'dark' ? 'dark' : 'light';
}

export function colorsFor(scheme: ColorSchemeName): ColorTokens {
  return scheme === 'dark' ? darkColors : lightColors;
}

/** The palette for the current appearance, for colors passed as props (icons, placeholders). */
export function useColors(): ColorTokens {
  return colorsFor(useColorSchemeName());
}

/**
 * Builds a component's styles once per palette and returns a hook that picks the current one:
 *
 *   const useStyles = createStyles((colors) => ({ card: { backgroundColor: colors.surface } }));
 *   function Card() { const styles = useStyles(); ... }
 */
export function createStyles<T extends StyleSheet.NamedStyles<T>>(
  factory: (colors: ColorTokens) => T & StyleSheet.NamedStyles<T>,
): () => T {
  const sheets = {
    light: StyleSheet.create(factory(lightColors)),
    dark: StyleSheet.create(factory(darkColors)),
  };
  return function useStyles() {
    return sheets[useColorSchemeName()];
  };
}
