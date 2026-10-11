import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { SymbolView } from 'expo-symbols';
import { Platform } from 'react-native';

import type { IconSpec } from '@/theme/icons';

/** SF Symbol on iOS; a close Material icon elsewhere so previews aren't blank. Decorative. */
export function Icon({ icon, size, color }: { icon: IconSpec; size: number; color: string }) {
  if (Platform.OS === 'ios') {
    return <SymbolView name={icon.sf} size={size} tintColor={color} />;
  }
  return (
    <MaterialCommunityIcons
      name={icon.fallback}
      size={size}
      color={color}
      accessibilityElementsHidden
      importantForAccessibility="no"
    />
  );
}
