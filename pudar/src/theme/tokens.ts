/**
 * Blush Peach design tokens (PRD §8).
 *
 * The base palette is used for backgrounds, fills and selection. Text and icons drawn on top
 * of it use the `*Ink` tokens, which are darker shades of the same hues chosen to meet WCAG AA
 * (4.5:1 for text, 3:1 for icons). `src/theme/__tests__/contrast.test.ts` enforces the pairs.
 */
export const colors = {
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
  /** Primary-colored text, and the fill behind white button labels. */
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
} as const;

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
