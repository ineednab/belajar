import type { IconSpec } from './icons';

/**
 * Fixed icon set and accent palette for profiles (PRD §6 Profiles, Q4).
 * Stored in the database by key/hex, so names and symbols can change without a migration.
 */
export const PROFILE_ICONS: readonly { key: string; icon: IconSpec; label: string }[] = [
  { key: 'moon', icon: { sf: 'moon.fill', fallback: 'moon-waning-crescent' }, label: 'Bulan' },
  { key: 'heart', icon: { sf: 'heart.fill', fallback: 'heart' }, label: 'Hati' },
  { key: 'leaf', icon: { sf: 'leaf.fill', fallback: 'leaf' }, label: 'Daun' },
  { key: 'cloud', icon: { sf: 'cloud.fill', fallback: 'cloud' }, label: 'Awan' },
  { key: 'star', icon: { sf: 'star.fill', fallback: 'star' }, label: 'Bintang' },
  { key: 'sparkles', icon: { sf: 'sparkles', fallback: 'creation' }, label: 'Kilau' },
  { key: 'drop', icon: { sf: 'drop.fill', fallback: 'water' }, label: 'Tetes air' },
  { key: 'bird', icon: { sf: 'bird.fill', fallback: 'bird' }, label: 'Burung' },
];

/** Avatar fills. The avatar's icon or initial is drawn in `onAccent` on top (≥ 3:1, tested). */
export const PROFILE_COLORS: readonly { hex: string; label: string }[] = [
  { hex: '#D97C8B', label: 'Mawar' },
  { hex: '#E8A77E', label: 'Persik' },
  { hex: '#D4B48A', label: 'Pasir' },
  { hex: '#9DBF9E', label: 'Sage' },
  { hex: '#8DB4D6', label: 'Langit' },
  { hex: '#B7A6DB', label: 'Lavender' },
];

export function profileIcon(iconKey: string | null): IconSpec | null {
  return PROFILE_ICONS.find((icon) => icon.key === iconKey)?.icon ?? null;
}
