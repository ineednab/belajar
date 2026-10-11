import { StyleSheet, Text, View } from 'react-native';

import { profileIcon } from '@/theme/profile-style';
import { colors } from '@/theme/tokens';
import { fonts } from '@/theme/typography';

import { Icon } from './icon';

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
  const symbol = profileIcon(icon);
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
        <Icon icon={symbol} size={size * 0.5} color={colors.text} />
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
