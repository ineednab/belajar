import { Text, type TextProps } from 'react-native';

import { typography, type TypographyVariant } from '@/theme/typography';

export function AppText({
  variant = 'body',
  style,
  ...props
}: TextProps & { variant?: TypographyVariant }) {
  return <Text style={[typography[variant], style]} {...props} />;
}
