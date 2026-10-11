import { SymbolView } from 'expo-symbols';
import { router } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';

import type { Profile } from '@/db/profiles';
import { colors, radii, spacing } from '@/theme/tokens';

import { AppText } from './app-text';
import { ProfileAvatar } from './profile-avatar';

/** Top-of-Today chip that opens the profile switcher. */
export function ProfileSelector({ profile }: { profile: Profile }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Pudar for ${profile.name}`}
      accessibilityHint="Switch or create a Pudar"
      onPress={() => router.push('/profiles')}
      style={({ pressed }) => [styles.chip, pressed && styles.pressed]}>
      <ProfileAvatar
        name={profile.name}
        icon={profile.icon}
        accentColor={profile.accentColor}
        size={28}
      />
      <AppText variant="label" numberOfLines={1} style={styles.label}>
        Pudar for {profile.name}
      </AppText>
      <SymbolView name="chevron.down" size={12} tintColor={colors.mutedInk} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignSelf: 'flex-start',
    maxWidth: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
    paddingLeft: spacing.xs,
    paddingRight: spacing.md,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  label: {
    flexShrink: 1,
  },
  pressed: {
    opacity: 0.7,
  },
});
