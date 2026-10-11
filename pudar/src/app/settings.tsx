import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { Card } from '@/components/card';
import { Screen } from '@/components/screen';
import { readDiagnostics, type DbDiagnostics } from '@/db/connection';
import { useDatabase } from '@/db/provider';
import { spacing } from '@/theme/tokens';

// Placeholder until Epic 7 (Settings & privacy), plus a development-only storage check.
export default function SettingsScreen() {
  return (
    <Screen>
      <AppText variant="title" accessibilityRole="header">
        Settings
      </AppText>
      <Card>
        <AppText variant="heading">How fading works</AppText>
        <AppText variant="caption">
          Each entry slowly fades, and its text is erased 30 days after you write it. The date and
          your check-ins stay.
        </AppText>
      </Card>
      {__DEV__ && <StorageDiagnostics />}
    </Screen>
  );
}

/** Used for the Epic 1 encryption check (README → "Verify encryption"). */
function StorageDiagnostics() {
  const { db } = useDatabase();
  const [diagnostics, setDiagnostics] = useState<DbDiagnostics | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    readDiagnostics(db).then(setDiagnostics, (e: unknown) => setError(String(e)));
  }, [db]);

  const rows: [string, string][] = diagnostics
    ? [
        ['Encryption', diagnostics.cipherVersion ? `SQLCipher ${diagnostics.cipherVersion}` : 'NOT encrypted'],
        ['Foreign keys', diagnostics.foreignKeys ? 'on' : 'OFF'],
        ['Secure delete', diagnostics.secureDelete ? 'on' : 'OFF'],
        ['Journal mode', diagnostics.journalMode],
        ['Schema version', `v${diagnostics.schemaVersion}`],
      ]
    : [];

  return (
    <Card>
      <AppText variant="heading">Storage diagnostics (dev)</AppText>
      {error && <AppText variant="caption">{error}</AppText>}
      {rows.map(([label, value]) => (
        <View key={label} style={styles.row}>
          <AppText variant="label">{label}</AppText>
          <AppText variant="caption" selectable>
            {value}
          </AppText>
        </View>
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
});
