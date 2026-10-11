import type { SFSymbol } from 'expo-symbols';

/**
 * Fixed icon set and accent palette for profiles (PRD §6 Profiles, Q4).
 * Stored in the database by key/hex, so names and symbols can change without a migration.
 */
export const PROFILE_ICONS: readonly { key: string; symbol: SFSymbol; label: string }[] = [
  { key: 'moon', symbol: 'moon.fill', label: 'Moon' },
  { key: 'heart', symbol: 'heart.fill', label: 'Heart' },
  { key: 'leaf', symbol: 'leaf.fill', label: 'Leaf' },
  { key: 'cloud', symbol: 'cloud.fill', label: 'Cloud' },
  { key: 'star', symbol: 'star.fill', label: 'Star' },
  { key: 'sparkles', symbol: 'sparkles', label: 'Sparkles' },
  { key: 'drop', symbol: 'drop.fill', label: 'Drop' },
  { key: 'bird', symbol: 'bird.fill', label: 'Bird' },
];

/** Avatar fills. The avatar's icon or initial is drawn in `colors.text` on top (≥ 3:1, tested). */
export const PROFILE_COLORS: readonly { hex: string; label: string }[] = [
  { hex: '#D97C8B', label: 'Rose' },
  { hex: '#E8A77E', label: 'Peach' },
  { hex: '#D4B48A', label: 'Sand' },
  { hex: '#9DBF9E', label: 'Sage' },
  { hex: '#8DB4D6', label: 'Sky' },
  { hex: '#B7A6DB', label: 'Lavender' },
];

export function profileSymbol(iconKey: string | null): SFSymbol | null {
  return PROFILE_ICONS.find((icon) => icon.key === iconKey)?.symbol ?? null;
}
