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
      'Start again from today?',
      'Starting again is part of it. Your count will begin from today.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start again',
          onPress: async () => {
            await startAgain(profile.id);
            router.back();
          },
        },
      ],
    );

  const confirmDelete = () =>
    Alert.alert(
      `Delete "${profile.name}"?`,
      "This permanently deletes this Pudar, with all of its entries and check-ins. This can't be undone.",
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
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
        submitLabel="Save changes"
        onSubmit={async (input) => {
          await update(profile.id, input);
          router.back();
        }}>
        <View style={styles.actions}>
          {canStartAgain && (
            <View style={styles.action}>
              <TextButton label="Start again from today" onPress={confirmStartAgain} />
              <AppText variant="caption">Resets the no-contact count to today.</AppText>
            </View>
          )}
          <View style={styles.action}>
            <TextButton label="Delete this Pudar" destructive onPress={confirmDelete} />
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
