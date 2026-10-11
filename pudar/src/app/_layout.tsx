import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider, type Theme } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { StartupError } from '@/components/startup-error';
import { DatabaseProvider, useOpenDatabase } from '@/db/provider';
import { ProfilesProvider } from '@/profiles/provider';
import { colorsFor, useColorSchemeName } from '@/theme/theme';
import { fontAssets, fonts } from '@/theme/typography';

SplashScreen.preventAutoHideAsync();

function navigationTheme(scheme: 'light' | 'dark'): Theme {
  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
  const colors = colorsFor(scheme);
  return {
    ...base,
    colors: {
      ...base.colors,
      background: colors.background,
      card: colors.surface,
      primary: colors.primaryInk,
      text: colors.text,
      border: colors.border,
    },
  };
}

export default function RootLayout() {
  const scheme = useColorSchemeName();
  const colors = colorsFor(scheme);
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
    <DatabaseProvider
      value={{ db: database.db, encrypted: database.encrypted, deleteAllData: database.deleteAllData }}>
      <ProfilesProvider>
        <ThemeProvider value={navigationTheme(scheme)}>
          <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
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
                title: 'Pudar-mu',
                presentation: 'formSheet',
                sheetAllowedDetents: [0.5, 1],
                sheetGrabberVisible: true,
              }}
            />
            <Stack.Screen name="profile/new" options={{ title: 'Pudar baru', presentation: 'modal' }} />
            <Stack.Screen name="profile/[id]" options={{ title: 'Ubah Pudar', presentation: 'modal' }} />
            <Stack.Screen name="ingin-chat" options={{ title: 'Ingin chat dia', presentation: 'modal' }} />
            <Stack.Screen name="entry/[id]" options={{ title: '', headerBackTitle: 'Kenangan' }} />
            {['settings/fading', 'settings/privacy', 'settings/support', 'settings/delete'].map((name) => (
              <Stack.Screen key={name} name={name} options={{ title: '', headerBackTitle: 'Pengaturan' }} />
            ))}
          </Stack>
        </ThemeProvider>
      </ProfilesProvider>
    </DatabaseProvider>
  );
}
