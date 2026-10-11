import { AppText } from '@/components/app-text';
import { Card } from '@/components/card';
import { Screen } from '@/components/screen';

// Placeholder until Epic 6 (Memory).
export default function MemoryScreen() {
  return (
    <Screen>
      <AppText variant="title" accessibilityRole="header">
        Memory
      </AppText>
      <Card>
        <AppText variant="caption">
          Your past entries will appear here, slowly fading with time.
        </AppText>
      </Card>
    </Screen>
  );
}
