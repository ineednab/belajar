import { useFonts } from 'expo-font';
import { DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { StartupError } from '@/components/startup-error';
import { DatabaseProvider, useOpenDatabase } from '@/db/provider';
import { ProfilesProvider } from '@/profiles/provider';
import { colors } from '@/theme/tokens';
import { fontAssets, fonts } from '@/theme/typography';

SplashScreen.preventAutoHideAsync();

const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.background,
    card: colors.surface,
    primary: colors.primaryInk,
    text: colors.text,
    border: colors.border,
  },
};

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(fontAssets);
  const database = useOpenDatabase();
  const fontsSettled = fontsLoaded || fontError !== null;
  const ready = fontsSettled && database.status !== 'loading';

  useEffect(() => {
    if (ready) {
      SplashScreen.hideAsync();
    }
  }, [ready]);

  if (!fontsSettled || database.status === 'loading') {
    return null;
  }
  if (database.status === 'error') {
    return <StartupError error={database.error} onRetry={database.retry} />;
  }
  return (
    <DatabaseProvider value={{ db: database.db, encrypted: database.encrypted }}>
      <ProfilesProvider>
        <ThemeProvider value={navigationTheme}>
          <StatusBar style="dark" />
          <Stack
            screenOptions={{
              contentStyle: { backgroundColor: colors.background },
              headerStyle: { backgroundColor: colors.background },
              headerShadowVisible: false,
              headerTintColor: colors.primaryInk,
              headerTitleStyle: { fontFamily: fonts.serif, color: colors.text },
            }}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen
              name="profiles"
              options={{
                title: 'Your Pudars',
                presentation: 'formSheet',
                sheetAllowedDetents: [0.5, 1],
                sheetGrabberVisible: true,
              }}
            />
            <Stack.Screen name="profile/new" options={{ title: 'New Pudar', presentation: 'modal' }} />
            <Stack.Screen name="profile/[id]" options={{ title: 'Edit Pudar', presentation: 'modal' }} />
          </Stack>
        </ThemeProvider>
      </ProfilesProvider>
    </DatabaseProvider>
  );
}
