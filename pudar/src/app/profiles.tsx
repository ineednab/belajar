import { router } from 'expo-router';
import { Pressable, ScrollView, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { Icon } from '@/components/icon';
import { ProfileAvatar } from '@/components/profile-avatar';
import { SecondaryButton } from '@/components/secondary-button';
import { TextButton } from '@/components/profile-form';
import { isClosed, type Profile } from '@/db/profiles';
import { useProfiles } from '@/profiles/provider';
import { ICONS } from '@/theme/icons';
import { spacing } from '@/theme/tokens';
import { createStyles, useColors } from '@/theme/theme';

/** Profile switcher sheet (PRD §6 Today: profile selector). */
export default function ProfilesSheet() {
  const styles = useStyles();
  const colors = useColors();
  const { profiles, activeProfile, setActive } = useProfiles();

  const choose = async (id: string) => {
    await setActive(id);
    router.back();
  };

  const open = profiles.filter((p) => !isClosed(p));
  const closed = profiles.filter(isClosed);

  const renderRow = (profile: Profile) => {
    const active = profile.id === activeProfile?.id;
    return (
      <View key={profile.id} style={styles.row}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Pudar untuk ${profile.name}`}
          accessibilityState={{ selected: active }}
          onPress={() => choose(profile.id)}
          style={({ pressed }) => [styles.rowMain, pressed && styles.pressed]}>
          <ProfileAvatar name={profile.name} icon={profile.icon} accentColor={profile.accentColor} />
          <AppText variant="label" style={styles.name} numberOfLines={1}>
            {profile.name}
          </AppText>
          {active && <Icon icon={ICONS.check} size={18} color={colors.primaryInk} />}
        </Pressable>
        <TextButton
          label="Ubah"
          onPress={() => router.push({ pathname: '/profile/[id]', params: { id: profile.id } })}
        />
      </View>
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.content}>
      {open.map(renderRow)}
      {closed.length > 0 && (
        <AppText variant="caption" style={styles.sectionTitle} accessibilityRole="header">
          SUDAH SELESAI
        </AppText>
      )}
      {closed.map(renderRow)}
      <View style={styles.newButton}>
        <SecondaryButton label="Pudar baru" icon={ICONS.plus} onPress={() => router.push('/profile/new')} />
      </View>
    </ScrollView>
  );
}

const useStyles = createStyles((colors) => ({
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
  sectionTitle: {
    marginTop: spacing.md,
    letterSpacing: 0.5,
  },
  newButton: {
    marginTop: spacing.md,
  },
}));
