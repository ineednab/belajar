import { Modal, View } from 'react-native';

import { radii, spacing } from '@/theme/tokens';
import { createStyles } from '@/theme/theme';

import { AppText } from './app-text';
import { PrimaryButton } from './primary-button';
import { SecondaryButton } from './secondary-button';

/** A calm confirmation in the app's own style, used for Unlock and Let Go (PRD §6). */
export function ConfirmDialog({
  visible,
  title,
  body,
  confirmLabel,
  destructive = false,
  onConfirm,
  onCancel,
}: {
  visible: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const styles = useStyles();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View style={styles.sheet} accessibilityViewIsModal>
          <AppText variant="heading" accessibilityRole="header">
            {title}
          </AppText>
          <AppText variant="body">{body}</AppText>
          <View style={styles.actions}>
            <PrimaryButton label={confirmLabel} destructive={destructive} onPress={onConfirm} />
            <SecondaryButton label="Batal" onPress={onCancel} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const useStyles = createStyles((colors) => ({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
    backgroundColor: colors.scrim,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    gap: spacing.md,
  },
  actions: {
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
}));
