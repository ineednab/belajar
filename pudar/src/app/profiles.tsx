import { SymbolView } from 'expo-symbols';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { ProfileAvatar } from '@/components/profile-avatar';
import { TextButton } from '@/components/profile-form';
import { useProfiles } from '@/profiles/provider';
import { colors, radii, spacing } from '@/theme/tokens';

/** Profile switcher sheet (PRD §6 Today: profile selector). */
export default function ProfilesSheet() {
  const { profiles, activeProfile, setActive } = useProfiles();

  const choose = async (id: string) => {
    await setActive(id);
    router.back();
  };

  return (
    <ScrollView contentContainerStyle={styles.content}>
      {profiles.map((profile) => {
        const active = profile.id === activeProfile?.id;
        return (
          <View key={profile.id} style={styles.row}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Pudar for ${profile.name}`}
              accessibilityState={{ selected: active }}
              onPress={() => choose(profile.id)}
              style={({ pressed }) => [styles.rowMain, pressed && styles.pressed]}>
              <ProfileAvatar
                name={profile.name}
                icon={profile.icon}
                accentColor={profile.accentColor}
              />
              <AppText variant="label" style={styles.name} numberOfLines={1}>
                {profile.name}
              </AppText>
              {active && <SymbolView name="checkmark" size={18} tintColor={colors.primaryInk} />}
            </Pressable>
            <TextButton
              label="Edit"
              onPress={() => router.push({ pathname: '/profile/[id]', params: { id: profile.id } })}
            />
          </View>
        );
      })}
      <Pressable
        accessibilityRole="button"
        onPress={() => router.push('/profile/new')}
        style={({ pressed }) => [styles.newButton, pressed && styles.pressed]}>
        <SymbolView name="plus" size={16} tintColor={colors.primaryInk} />
        <AppText variant="label" style={styles.newLabel}>
          New Pudar
        </AppText>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  rowMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  name: {
    flex: 1,
  },
  pressed: {
    opacity: 0.6,
  },
  newButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.primaryInk,
  },
  newLabel: {
    color: colors.primaryInk,
  },
});
