import { router } from 'expo-router';

import { EmptyState } from '@/components/empty-state';
import { PrimaryButton } from '@/components/primary-button';
import { ProfileSelector } from '@/components/profile-selector';
import { Screen } from '@/components/screen';
import { useProfiles } from '@/profiles/provider';

// Empty state until Epic 6 (Memory) adds the timeline.
export default function MemoryScreen() {
  const { activeProfile } = useProfiles();

  return (
    <Screen>
      {activeProfile && <ProfileSelector profile={activeProfile} />}
      <EmptyState
        icon="leaf"
        title="Your memories will appear here, slowly fading with time."
        body="Write your first entry to start building your timeline.">
        <PrimaryButton label="Write your first entry" onPress={() => router.navigate('/')} />
      </EmptyState>
    </Screen>
  );
}
