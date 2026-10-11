/**
 * Blush Peach design tokens (PRD §8), in a light and a dark palette (v1.3: the app follows the
 * system appearance). Components read them through `useColors` / `createStyles` in `./theme`.
 *
 * The base palette is used for backgrounds, fills and selection. Text and icons drawn on top
 * of it use the `*Ink` tokens, chosen to meet WCAG AA (4.5:1 for text, 3:1 for icons) in both
 * palettes. `src/theme/__tests__/contrast.test.ts` enforces the pairs.
 */
export const lightColors = {
  background: '#FDF7F4',
  surface: '#FFFCFA',
  primary: '#D97C8B',
  secondary: '#F7E4E4',
  text: '#43383A',
  muted: '#8C8081',
  neutralIcon: '#77736F',
  neutralBg: '#E8E6E3',
  selfGreen: '#7DA589',
  selfGreenBg: '#E4EFE6',

  /** Secondary text. `muted` is only 3.6:1 on the background. */
  mutedInk: '#766A6C',
  /** Primary-colored text, and the fill behind `onPrimaryInk` button labels. */
  primaryInk: '#A9505F',
  onPrimaryInk: '#FFFFFF',
  /** "Chose myself" icon on `selfGreenBg`. */
  selfGreenInk: '#567F63',
  /** Status pills: "Baru" on roseBg, "Pudar dalam N hari" / "Hampir pudar" on peachBg. */
  roseBg: '#FCEEEE',
  peachBg: '#FBE7DA',
  peachInk: '#8A4B22',
  /** Errors and destructive actions. */
  dangerInk: '#B3261E',
  border: '#EFE4E0',
  /** Icons and initials drawn on a profile's accent color, the same in both palettes. */
  onAccent: '#43383A',
  /** Dims the screen behind a dialog. */
  scrim: 'rgba(67, 56, 58, 0.35)',
} as const;

export type ColorTokens = { readonly [K in keyof typeof lightColors]: string };

/** Night version of Blush Peach: warm near-black, with lighter inks and dark text on filled buttons. */
export const darkColors: ColorTokens = {
  background: '#1B1617',
  surface: '#252021',
  primary: '#D97C8B',
  secondary: '#3E2D30',
  text: '#F2E9E7',
  muted: '#8F8486',
  neutralIcon: '#B8B0AD',
  neutralBg: '#353031',
  selfGreen: '#7DA589',
  selfGreenBg: '#22302A',
  mutedInk: '#B5A9AB',
  primaryInk: '#EC9DAA',
  onPrimaryInk: '#2B1A1E',
  selfGreenInk: '#94C2A2',
  roseBg: '#3D262A',
  peachBg: '#3A2A20',
  peachInk: '#F1B68E',
  dangerInk: '#F28B82',
  border: '#3A3133',
  onAccent: '#43383A',
  scrim: 'rgba(0, 0, 0, 0.55)',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radii = {
  sm: 8,
  md: 16,
  lg: 24,
  pill: 999,
} as const;
