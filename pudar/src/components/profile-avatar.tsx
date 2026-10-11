import { SymbolView } from 'expo-symbols';
import { StyleSheet, Text, View } from 'react-native';

import { profileSymbol } from '@/theme/profile-style';
import { colors } from '@/theme/tokens';
import { fonts } from '@/theme/typography';

/** Circle with the profile's icon (or its initial) on its accent color. Decorative. */
export function ProfileAvatar({
  name,
  icon,
  accentColor,
  size = 36,
}: {
  name: string;
  icon: string | null;
  accentColor: string | null;
  size?: number;
}) {
  const symbol = profileSymbol(icon);
  return (
    <View
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.circle,
        { width: size, height: size, borderRadius: size / 2 },
        { backgroundColor: accentColor ?? colors.secondary },
      ]}>
      {symbol ? (
        <SymbolView name={symbol} size={size * 0.5} tintColor={colors.text} />
      ) : (
        <Text style={[styles.initial, { fontSize: size * 0.45 }]}>
          {Array.from(name.trim())[0]?.toUpperCase() ?? ''}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: {
    fontFamily: fonts.serif,
    color: colors.text,
  },
});
