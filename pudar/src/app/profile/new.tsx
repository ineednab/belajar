import { router } from 'expo-router';
import { ScrollView, StyleSheet } from 'react-native';

import { ProfileForm } from '@/components/profile-form';
import { useProfiles } from '@/profiles/provider';
import { spacing } from '@/theme/tokens';

export default function NewProfileScreen() {
  const { create } = useProfiles();

  return (
    <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <ProfileForm
        initial={{ name: '', icon: null, accentColor: null, noContactStartDate: null }}
        submitLabel="Buat Pudar"
        onSubmit={async (input) => {
          await create(input);
          router.dismissAll(); // back to the tabs, now showing the new Pudar
        }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
});
