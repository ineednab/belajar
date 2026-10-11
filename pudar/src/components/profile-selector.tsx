import { router } from 'expo-router';
import { Pressable } from 'react-native';

import type { Profile } from '@/db/profiles';
import { ICONS } from '@/theme/icons';
import { spacing } from '@/theme/tokens';
import { createStyles, useColors } from '@/theme/theme';
import { typography } from '@/theme/typography';

import { AppText } from './app-text';
import { Icon } from './icon';
import { ProfileAvatar } from './profile-avatar';

/** Top-of-Today chip that opens the profile switcher. */
export function ProfileSelector({ profile }: { profile: Profile }) {
  const styles = useStyles();
  const colors = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Pudar untuk ${profile.name}`}
      accessibilityHint="Ganti atau buat Pudar"
      onPress={() => router.push('/profiles')}
      style={({ pressed }) => [styles.chip, pressed && styles.pressed]}>
      <ProfileAvatar
        name={profile.name}
        icon={profile.icon}
        accentColor={profile.accentColor}
        size={40}
      />
      <AppText numberOfLines={1} style={styles.label}>
        Pudar untuk {profile.name}
      </AppText>
      <Icon icon={ICONS.chevronDown} size={16} color={colors.primaryInk} />
    </Pressable>
  );
}

const useStyles = createStyles((colors) => ({
  chip: {
    alignSelf: 'flex-start',
    maxWidth: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 4,
    paddingVertical: spacing.xs,
  },
  label: {
    ...typography.heading,
    color: colors.primaryInk,
    flexShrink: 1,
  },
  pressed: {
    opacity: 0.7,
  },
}));
