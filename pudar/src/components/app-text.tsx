import { Text, type TextProps } from 'react-native';

import { useColors } from '@/theme/theme';
import { typography, type TypographyVariant } from '@/theme/typography';

export function AppText({
  variant = 'body',
  style,
  ...props
}: TextProps & { variant?: TypographyVariant }) {
  const colors = useColors();
  const color = variant === 'caption' ? colors.mutedInk : colors.text;
  return <Text style={[typography[variant], { color }, style]} {...props} />;
}
