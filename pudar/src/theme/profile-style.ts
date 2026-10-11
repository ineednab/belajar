import type { IconSpec } from './icons';

/**
 * Fixed icon set and accent palette for profiles (PRD §6 Profiles, Q4).
 * Stored in the database by key/hex, so names and symbols can change without a migration.
 */
export const PROFILE_ICONS: readonly { key: string; icon: IconSpec; label: string }[] = [
  { key: 'moon', icon: { sf: 'moon.fill', fallback: 'moon-waning-crescent' }, label: 'Moon' },
  { key: 'heart', icon: { sf: 'heart.fill', fallback: 'heart' }, label: 'Heart' },
  { key: 'leaf', icon: { sf: 'leaf.fill', fallback: 'leaf' }, label: 'Leaf' },
  { key: 'cloud', icon: { sf: 'cloud.fill', fallback: 'cloud' }, label: 'Cloud' },
  { key: 'star', icon: { sf: 'star.fill', fallback: 'star' }, label: 'Star' },
  { key: 'sparkles', icon: { sf: 'sparkles', fallback: 'creation' }, label: 'Sparkles' },
  { key: 'drop', icon: { sf: 'drop.fill', fallback: 'water' }, label: 'Drop' },
  { key: 'bird', icon: { sf: 'bird.fill', fallback: 'bird' }, label: 'Bird' },
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

export function profileIcon(iconKey: string | null): IconSpec | null {
  return PROFILE_ICONS.find((icon) => icon.key === iconKey)?.icon ?? null;
}
