import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { EmptyState } from '@/components/empty-state';
import { PrimaryButton } from '@/components/primary-button';
import { ProfileSelector } from '@/components/profile-selector';
import { Screen } from '@/components/screen';
import { SecondaryButton } from '@/components/secondary-button';
import { noContactDays, todayLocal } from '@/lib/date';
import { useProfiles } from '@/profiles/provider';
import { spacing } from '@/theme/tokens';

// Profile selector, counter and first-launch state (Epic 2). The full Today screen arrives in Epic 4.
export default function TodayScreen() {
  const { activeProfile } = useProfiles();

  if (!activeProfile) {
    return (
      <Screen>
        <View style={styles.firstLaunch}>
          <EmptyState
            icon="leaf"
            title="A journal for what you can't send."
            body="Create a space for the person you're letting go of. You can make more than one.">
            <PrimaryButton label="Create your first Pudar" onPress={() => router.push('/profile/new')} />
          </EmptyState>
        </View>
      </Screen>
    );
  }

  const start = activeProfile.noContactStartDate;
  const days = start ? noContactDays(start, todayLocal()) : null;
  const editProfile = () =>
    router.push({ pathname: '/profile/[id]', params: { id: activeProfile.id } });

  return (
    <Screen>
      <ProfileSelector profile={activeProfile} />
      {days === null ? (
        <EmptyState
          icon="leaf"
          title="Set the day you started"
          body="Choose the date you began no contact to see your journey here.">
          <SecondaryButton label="Set start date" icon="calendar" compact onPress={editProfile} />
        </EmptyState>
      ) : (
        <View style={styles.counter} accessible accessibilityLabel={counterLabel(days)}>
          <AppText variant="display" style={styles.center}>
            {days === 0 ? 'Starting today' : `${days} ${days === 1 ? 'day' : 'days'}`}
          </AppText>
          <AppText variant="caption" style={[styles.center, styles.subtitle]}>
            no contact · One day at a time.
          </AppText>
        </View>
      )}
    </Screen>
  );
}

function counterLabel(days: number): string {
  const count = days === 0 ? 'Starting today' : `${days} ${days === 1 ? 'day' : 'days'}`;
  return `${count} no contact. One day at a time.`;
}

const styles = StyleSheet.create({
  firstLaunch: {
    paddingTop: spacing.xxl,
  },
  counter: {
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.lg,
  },
  center: {
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 21,
  },
});
