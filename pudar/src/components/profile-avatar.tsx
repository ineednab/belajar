import { Text, View } from 'react-native';

import { profileIcon } from '@/theme/profile-style';
import { createStyles, useColors } from '@/theme/theme';
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
  const styles = useStyles();
  const colors = useColors();
  const symbol = profileIcon(icon);
  // Accent fills are mid-tones, so they keep dark ink in both palettes.
  const ink = accentColor ? colors.onAccent : colors.text;
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
        <Icon icon={symbol} size={size * 0.5} color={ink} />
      ) : (
        <Text style={[styles.initial, { fontSize: size * 0.45, color: ink }]}>
          {Array.from(name.trim())[0]?.toUpperCase() ?? ''}
        </Text>
      )}
    </View>
  );
}

const useStyles = createStyles((colors) => ({
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: {
    fontFamily: fonts.serif,
    color: colors.text,
  },
}));
