import { NativeTabs } from 'expo-router/unstable-native-tabs';

import { colors } from '@/theme/tokens';

export function AppTabs() {
  return (
    <NativeTabs
      backgroundColor={colors.surface}
      tintColor={colors.primaryInk}
      labelStyle={{ color: colors.mutedInk }}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Hari ini</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'house', selected: 'house.fill' }} />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="memory">
        <NativeTabs.Trigger.Label>Kenangan</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'clock', selected: 'clock.fill' }} />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="settings">
        <NativeTabs.Trigger.Label>Pengaturan</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf={{ default: 'gearshape', selected: 'gearshape.fill' }} />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
