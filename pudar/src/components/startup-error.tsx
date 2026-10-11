import { StyleSheet, View } from 'react-native';

import { colors, spacing } from '@/theme/tokens';

import { AppText } from './app-text';
import { PrimaryButton } from './primary-button';

/**
 * Shown when the database can't be opened. Nothing is deleted on this path (see db/open.ts),
 * so retrying is always safe.
 */
export function StartupError({ error, onRetry }: { error: Error; onRetry: () => void }) {
  return (
    <View style={styles.container}>
      <AppText variant="heading" style={styles.center}>
        Pudar tidak bisa membuka jurnalmu
      </AppText>
      <AppText variant="caption" style={styles.center}>
        Tulisanmu tidak berubah. Coba lagi. Kalau ini terus terjadi, nyalakan ulang iPhone-mu.
      </AppText>
      {__DEV__ && (
        <AppText variant="caption" style={styles.center} selectable>
          {error.message}
        </AppText>
      )}
      <PrimaryButton label="Coba lagi" onPress={onRetry} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.xl,
    backgroundColor: colors.background,
  },
  center: {
    textAlign: 'center',
  },
});
