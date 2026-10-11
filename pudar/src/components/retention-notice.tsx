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
            Your words will fade.
          </AppText>
          <AppText variant="body">
            Each entry slowly fades and its text is erased 30 days after you write it, whether or
            not you open Pudar. The date and your check-ins stay.
          </AppText>
          <AppText variant="body">
            You can lock an entry to hide it, or let it go sooner. Pudar can&apos;t recover erased or
            deleted words, and there is no export.
          </AppText>
          <PrimaryButton label="I understand" onPress={onAcknowledge} />
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
