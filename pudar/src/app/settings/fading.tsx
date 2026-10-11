import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { InfoPage, InfoSection, Paragraph } from '@/components/info-page';
import { StatusPill } from '@/components/status-pill';
import { fadeLabel } from '@/lib/fade-label';
import { MIN_CARD_OPACITY } from '@/lib/fading';
import { radii, spacing } from '@/theme/tokens';
import { createStyles } from '@/theme/theme';

const STAGES = [
  {
    label: fadeLabel({ status: 'active', opacity: 1, daysLeft: 30 }),
    text: 'Hari pertama setelah kamu menulis.',
  },
  {
    label: fadeLabel({ status: 'fading', opacity: 0.7, daysLeft: 20 }),
    text: 'Mulai hari kedua, kartunya di Kenangan perlahan memudar.',
  },
  {
    label: fadeLabel({ status: 'near_expiry', opacity: MIN_CARD_OPACITY, daysLeft: 3 }),
    text: 'Tiga hari terakhir sebelum isinya terhapus.',
  },
  {
    label: fadeLabel({ status: 'faded', opacity: MIN_CARD_OPACITY, daysLeft: 0 }),
    text: 'Setelah 30 hari, isinya terhapus selamanya.',
  },
];

/** Settings → "How fading works": the retention notice as a page (PRD §6 Retention notice). */
export default function FadingScreen() {
  const styles = useStyles();
  return (
    <InfoPage title="Cara tulisan memudar">
      <Paragraph>
        Setiap tulisan perlahan memudar, dan isinya terhapus 30 hari setelah kamu menulisnya, entah kamu
        membuka Pudar atau tidak. Tanggal, jam, dan catatan perasaanmu tetap ada.
      </Paragraph>

      <View style={styles.stages}>
        {STAGES.map(({ label, text }, index) => (
          <View key={label.text} style={[styles.stage, index > 0 && styles.divider]}>
            <StatusPill text={label.text} tone={label.tone} />
            <AppText variant="caption" style={styles.stageText}>
              {text}
            </AppText>
          </View>
        ))}
      </View>

      <InfoSection title="Kunci">
        <Paragraph>
          Kalau butuh jarak, kunci tulisan untuk menyembunyikan kata-katanya. Waktunya tetap berjalan, jadi
          tulisan yang dikunci juga memudar.
        </Paragraph>
      </InfoSection>

      <InfoSection title="Lepaskan">
        <Paragraph>
          Kalau sudah siap, kamu bisa melepaskan tulisan lebih cepat. Tulisan itu langsung terhapus
          selamanya.
        </Paragraph>
      </InfoSection>

      <InfoSection title="Yang perlu kamu tahu">
        <Paragraph>
          Pudar tidak bisa memulihkan kata-kata yang sudah terhapus, dan tidak ada fitur ekspor. Draf yang
          belum disimpan juga terhapus kalau tidak disentuh selama 30 hari.
        </Paragraph>
      </InfoSection>
    </InfoPage>
  );
}

const useStyles = createStyles((colors) => ({
  stages: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
  },
  stage: {
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  divider: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  stageText: {
    fontSize: 15,
    lineHeight: 21,
  },
}));
