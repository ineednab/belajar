import { useFonts } from 'expo-font';
import { DefaultTheme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { AppTabs } from '@/components/app-tabs';
import { StartupError } from '@/components/startup-error';
import { DatabaseProvider, useOpenDatabase } from '@/db/provider';
import { colors } from '@/theme/tokens';
import { fontAssets } from '@/theme/typography';

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
      <ThemeProvider value={navigationTheme}>
        <StatusBar style="dark" />
        <AppTabs />
      </ThemeProvider>
    </DatabaseProvider>
  );
}
