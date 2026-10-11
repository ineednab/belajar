import { router } from 'expo-router';

import { AppText } from '@/components/app-text';
import { Card } from '@/components/card';
import { PrimaryButton } from '@/components/primary-button';
import { ProfileSelector } from '@/components/profile-selector';
import { Screen } from '@/components/screen';
import { noContactDays, todayLocal } from '@/lib/date';
import { useProfiles } from '@/profiles/provider';

// Profile selector and first-launch state (Epic 2). The full Today screen arrives in Epic 4.
export default function TodayScreen() {
  const { activeProfile } = useProfiles();
  const today = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  if (!activeProfile) {
    return (
      <Screen>
        <AppText variant="title" accessibilityRole="header">
          A journal for what you can&apos;t send.
        </AppText>
        <Card>
          <AppText variant="body">
            Create a space for the person you&apos;re letting go of. You can make more than one.
          </AppText>
          <PrimaryButton label="Create your first Pudar" onPress={() => router.push('/profile/new')} />
        </Card>
      </Screen>
    );
  }

  const start = activeProfile.noContactStartDate;
  const days = start ? noContactDays(start, todayLocal()) : null;

  return (
    <Screen>
      <ProfileSelector profile={activeProfile} />
      <AppText variant="caption">{today}</AppText>
      <Card>
        {days === null ? (
          <AppText variant="caption">No start date set yet.</AppText>
        ) : (
          <>
            <AppText variant="display">
              {days === 0 ? 'Starting today' : `${days} ${days === 1 ? 'day' : 'days'}`}
            </AppText>
            <AppText variant="caption">no contact · One day at a time.</AppText>
          </>
        )}
      </Card>
    </Screen>
  );
}
