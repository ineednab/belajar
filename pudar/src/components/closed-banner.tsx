import { StyleSheet, View } from 'react-native';

import type { Profile } from '@/db/profiles';
import { localDateToDate } from '@/lib/date';
import { LOCALE } from '@/lib/locale';
import { radii, spacing } from '@/theme/tokens';
import { createStyles } from '@/theme/theme';

import { AppText } from './app-text';
import { StatusPill } from './status-pill';

/** Shown on Today for a closed Pudar (PRD D23). The reopen count is neutral text only (Q7). */
export function ClosedBanner({ profile }: { profile: Profile }) {
  const styles = useStyles();
  const since = profile.closedOn
    ? localDateToDate(profile.closedOn).toLocaleDateString(LOCALE, { day: 'numeric', month: 'long', year: 'numeric' })
    : null;
  return (
    <View style={styles.card}>
      <StatusPill text="Selesai" tone="neutral" />
      <AppText variant="heading">Kamu sudah selesai dengan {profile.name}.</AppText>
      <AppText variant="caption" style={styles.body}>
        {since ? `Sejak ${since}. ` : ''}Pudar ini sekarang jadi riwayat yang hanya bisa dibaca. Tulisan yang
        ada tetap memudar sesuai waktunya. Kalau perlu, kamu bisa membukanya lagi dari Ubah Pudar.
      </AppText>
      {profile.reopenCount > 0 && (
        <AppText variant="caption" style={styles.body}>
          Dibuka lagi {profile.reopenCount} kali.
        </AppText>
      )}
    </View>
  );
}

const useStyles = createStyles((colors) => ({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
  },
}));
