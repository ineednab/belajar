import { NativeTabs } from 'expo-router/unstable-native-tabs';

import { colors } from '@/theme/tokens';

export function AppTabs() {
  return (
    <NativeTabs
      backgroundColor={colors.surface}
      tintColor={colors.primaryInk}
      labelStyle={{ color: colors.mutedInk }}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Today</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'sun.max', selected: 'sun.max.fill' }} />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="memory">
        <NativeTabs.Trigger.Label>Memory</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'book.closed', selected: 'book.closed.fill' }} />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="settings">
        <NativeTabs.Trigger.Label>Settings</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'gearshape', selected: 'gearshape.fill' }} />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
