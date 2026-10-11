import { router } from 'expo-router';

import { EmptyState } from '@/components/empty-state';
import { PrimaryButton } from '@/components/primary-button';
import { ProfileSelector } from '@/components/profile-selector';
import { Screen } from '@/components/screen';
import { useProfiles } from '@/profiles/provider';
import { ICONS } from '@/theme/icons';

// Empty state until Epic 6 (Memory) adds the timeline.
export default function MemoryScreen() {
  const { activeProfile } = useProfiles();

  return (
    <Screen>
      {activeProfile && <ProfileSelector profile={activeProfile} />}
      <EmptyState
        icon={ICONS.leaf}
        title="Kenanganmu akan muncul di sini, perlahan memudar seiring waktu."
        body="Tulis tulisan pertamamu untuk mulai mengisi linimasa.">
        <PrimaryButton label="Mulai menulis" onPress={() => router.navigate('/')} />
      </EmptyState>
    </Screen>
  );
}
