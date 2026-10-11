import type MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import type { SFSymbol } from 'expo-symbols';
import type { ComponentProps } from 'react';

/**
 * An icon as an SF Symbol (iOS) plus a Material Community Icons stand-in, used where SF Symbols
 * don't render (the web preview).
 */
export type IconSpec = {
  sf: SFSymbol;
  fallback: ComponentProps<typeof MaterialCommunityIcons>['name'];
};

export const ICONS = {
  brain: { sf: 'brain', fallback: 'brain' },
  rain: { sf: 'cloud.rain', fallback: 'weather-pouring' },
  leaf: { sf: 'leaf', fallback: 'leaf' },
  calendar: { sf: 'calendar', fallback: 'calendar-blank-outline' },
  check: { sf: 'checkmark', fallback: 'check' },
  checkCircle: { sf: 'checkmark.circle.fill', fallback: 'check-circle' },
  chevronDown: { sf: 'chevron.down', fallback: 'chevron-down' },
  chevronRight: { sf: 'chevron.right', fallback: 'chevron-right' },
  lock: { sf: 'lock', fallback: 'lock-outline' },
  lockOpen: { sf: 'lock.open', fallback: 'lock-open-variant-outline' },
  letGo: { sf: 'wind', fallback: 'weather-windy' },
  plus: { sf: 'plus', fallback: 'plus' },
} as const satisfies Record<string, IconSpec>;
