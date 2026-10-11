import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { View } from 'react-native';

import { AppText } from '@/components/app-text';
import { Card } from '@/components/card';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { Icon } from '@/components/icon';
import { ProfileAvatar } from '@/components/profile-avatar';
import { Screen } from '@/components/screen';
import { SettingsRow, SettingsSection } from '@/components/settings-list';
import { StatusPill } from '@/components/status-pill';
import { readDiagnostics, type DbDiagnostics } from '@/db/connection';
import { isClosed } from '@/db/profiles';
import { useDatabase } from '@/db/provider';
import { useProfiles } from '@/profiles/provider';
import { ICONS } from '@/theme/icons';
import { spacing } from '@/theme/tokens';
import { createStyles, useColors } from '@/theme/theme';

/** Settings and privacy (PRD §6, Epic 7). App lock arrives with Epic 8. */
export default function SettingsScreen() {
  const styles = useStyles();
  const colors = useColors();
  const { profiles } = useProfiles();
  // Open Pudars first, then the closed ones, as in the switcher.
  const sorted = [...profiles.filter((p) => !isClosed(p)), ...profiles.filter(isClosed)];
  const [confirmDelete, setConfirmDelete] = useState(false);
  const version = Constants.expoConfig?.version;

  return (
    <Screen>
      <AppText variant="title" accessibilityRole="header">
        Pengaturan
      </AppText>

      <SettingsSection title="Pudar-mu">
        {sorted.map((profile, index) => (
          <SettingsRow
            key={profile.id}
            first={index === 0}
            label={profile.name}
            accessibilityLabel={`Ubah Pudar untuk ${profile.name}${isClosed(profile) ? ', sudah selesai' : ''}`}
            leading={<ProfileAvatar name={profile.name} icon={profile.icon} accentColor={profile.accentColor} />}
            trailing={isClosed(profile) ? <StatusPill text="Selesai" tone="neutral" /> : undefined}
            onPress={() => router.push({ pathname: '/profile/[id]', params: { id: profile.id } })}
          />
        ))}
        <SettingsRow
          first={profiles.length === 0}
          label="Pudar baru"
          leading={
            <View style={styles.plus}>
              <Icon icon={ICONS.plus} size={18} color={colors.primaryInk} />
            </View>
          }
          onPress={() => router.push('/profile/new')}
        />
      </SettingsSection>

      <SettingsSection title="Tentang Pudar">
        <SettingsRow
          first
          label="Cara tulisan memudar"
          icon={ICONS.hourglass}
          onPress={() => router.push('/settings/fading')}
        />
        <SettingsRow label="Privasi" icon={ICONS.privacy} onPress={() => router.push('/settings/privacy')} />
        <SettingsRow
          label="Kalau kamu sedang berat"
          icon={ICONS.heart}
          onPress={() => router.push('/settings/support')}
        />
      </SettingsSection>

      <SettingsSection title="Data">
        <SettingsRow
          first
          destructive
          chevron={false}
          label="Hapus semua data"
          icon={ICONS.trash}
          onPress={() => setConfirmDelete(true)}
        />
      </SettingsSection>

      {version && (
        <AppText variant="caption" style={styles.version}>
          Pudar versi {version}
        </AppText>
      )}

      {__DEV__ && <StorageDiagnostics />}

      <ConfirmDialog
        visible={confirmDelete}
        title="Hapus semua data?"
        body="Semua Pudar, tulisan, catatan perasaan, dan draf akan terhapus selamanya dari HP ini. Pudar tidak bisa memulihkannya."
        confirmLabel="Lanjutkan"
        destructive
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          setConfirmDelete(false);
          router.push('/settings/delete');
        }}
      />
    </Screen>
  );
}

/** Used for the Epic 1 encryption check (README → "Verify encryption"). */
function StorageDiagnostics() {
  const styles = useStyles();
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

const useStyles = createStyles((colors) => ({
  plus: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.roseBg,
  },
  version: {
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
}));
