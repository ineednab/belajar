import { AppText } from '@/components/app-text';
import { Card } from '@/components/card';
import { Screen } from '@/components/screen';

// Placeholder until Epic 4 (Today screen).
export default function TodayScreen() {
  const today = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <Screen>
      <AppText variant="caption">{today}</AppText>
      <AppText variant="title" accessibilityRole="header">
        Today
      </AppText>
      <Card>
        <AppText variant="heading">How do I feel today?</AppText>
        <AppText variant="caption">
          Your Pudar, the no-contact counter and your journal will live here.
        </AppText>
      </Card>
    </Screen>
  );
}
