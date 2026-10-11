import { router, useLocalSearchParams } from 'expo-router';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { ProfileForm, TextButton } from '@/components/profile-form';
import { todayLocal } from '@/lib/date';
import { useProfiles } from '@/profiles/provider';
import { spacing } from '@/theme/tokens';

export default function EditProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profiles, update, remove, startAgain } = useProfiles();
  const profile = profiles.find((p) => p.id === id);

  if (!profile) {
    return null; // deleted while this screen was closing
  }

  const confirmStartAgain = () =>
    Alert.alert(
      'Mulai lagi dari hari ini?',
      'Memulai lagi adalah bagian dari prosesnya. Hitunganmu akan dimulai dari hari ini.',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Mulai lagi',
          onPress: async () => {
            await startAgain(profile.id);
            router.back();
          },
        },
      ],
    );

  const confirmDelete = () =>
    Alert.alert(
      `Hapus "${profile.name}"?`,
      'Pudar ini akan terhapus selamanya, beserta semua tulisan dan catatan perasaannya. Ini tidak bisa dibatalkan.',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: async () => {
            await remove(profile.id);
            router.dismissAll();
          },
        },
      ],
    );

  const canStartAgain =
    profile.noContactStartDate !== null && profile.noContactStartDate !== todayLocal();

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <ProfileForm
        key={profile.updatedAt} // reset the form after "Start again" changes the stored date
        initial={{
          name: profile.name,
          icon: profile.icon,
          accentColor: profile.accentColor,
          noContactStartDate: profile.noContactStartDate,
        }}
        submitLabel="Simpan perubahan"
        onSubmit={async (input) => {
          await update(profile.id, input);
          router.back();
        }}>
        <View style={styles.actions}>
          {canStartAgain && (
            <View style={styles.action}>
              <TextButton label="Mulai lagi dari hari ini" onPress={confirmStartAgain} />
              <AppText variant="caption">Mengatur ulang hitungan tanpa kontak ke hari ini.</AppText>
            </View>
          )}
          <View style={styles.action}>
            <TextButton label="Hapus Pudar ini" destructive onPress={confirmDelete} />
          </View>
        </View>
      </ProfileForm>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  actions: {
    gap: spacing.md,
    paddingTop: spacing.sm,
  },
  action: {
    gap: spacing.xs,
  },
});
