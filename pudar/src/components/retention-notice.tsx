import { Modal, StyleSheet, View } from 'react-native';

import { colors, radii, spacing } from '@/theme/tokens';

import { AppText } from './app-text';
import { PrimaryButton } from './primary-button';

/** Shown once, before the first entry is written (PRD §6 Retention notice). */
export function RetentionNotice({ visible, onAcknowledge }: { visible: boolean; onAcknowledge: () => void }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={() => {}}>
      <View style={styles.backdrop}>
        <View style={styles.sheet} accessibilityViewIsModal>
          <AppText variant="heading" accessibilityRole="header">
            Kata-katamu akan memudar.
          </AppText>
          <AppText variant="body">
            Setiap tulisan perlahan memudar, dan isinya terhapus 30 hari setelah kamu menulisnya,
            entah kamu membuka Pudar atau tidak. Tanggal dan catatan perasaanmu tetap ada.
          </AppText>
          <AppText variant="body">
            Kamu bisa mengunci tulisan untuk menyembunyikannya, atau melepaskannya lebih cepat. Pudar
            tidak bisa memulihkan kata-kata yang sudah terhapus, dan tidak ada fitur ekspor.
          </AppText>
          <PrimaryButton label="Aku mengerti" onPress={onAcknowledge} />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
    backgroundColor: 'rgba(67, 56, 58, 0.35)',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    gap: spacing.md,
  },
});
