import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { ProfileForm, TextButton } from '@/components/profile-form';
import { isClosed } from '@/db/profiles';
import { localDateToDate, todayLocal } from '@/lib/date';
import { LOCALE } from '@/lib/locale';
import { useProfiles } from '@/profiles/provider';
import { spacing } from '@/theme/tokens';

export default function EditProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profiles, update, remove, startAgain, reopen } = useProfiles();
  const profile = profiles.find((p) => p.id === id);
  const [confirmReopen, setConfirmReopen] = useState(false);

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

  const closed = isClosed(profile);
  const canStartAgain =
    !closed && profile.noContactStartDate !== null && profile.noContactStartDate !== todayLocal();
  const closedSince = profile.closedOn
    ? localDateToDate(profile.closedOn).toLocaleDateString(LOCALE, { day: 'numeric', month: 'long', year: 'numeric' })
    : null;

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
          {closed && (
            <View style={styles.action}>
              <TextButton label="Buka lagi" onPress={() => setConfirmReopen(true)} />
              <AppText variant="caption">
                Selesai sejak {closedSince}.
                {profile.reopenCount > 0 ? ` Dibuka lagi ${profile.reopenCount} kali.` : ''}
              </AppText>
            </View>
          )}
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
      <ConfirmDialog
        visible={confirmReopen}
        title={`Buka lagi Pudar untuk ${profile.name}?`}
        body="Tidak apa-apa. Kadang kita belum benar-benar selesai. Kamu bisa menulis dan mencatat perasaan lagi mulai hari ini, dan hitungan harinya berjalan lagi."
        confirmLabel="Buka lagi"
        onConfirm={async () => {
          setConfirmReopen(false);
          await reopen(profile.id);
          router.back();
        }}
        onCancel={() => setConfirmReopen(false)}
      />
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
