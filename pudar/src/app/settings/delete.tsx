import { router } from 'expo-router';
import { useState } from 'react';
import { TextInput, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { InfoPage, Paragraph } from '@/components/info-page';
import { PrimaryButton } from '@/components/primary-button';
import { SecondaryButton } from '@/components/secondary-button';
import { useDatabase } from '@/db/provider';
import { radii, spacing } from '@/theme/tokens';
import { createStyles } from '@/theme/theme';
import { fonts } from '@/theme/typography';

const CONFIRM_WORD = 'HAPUS';

/**
 * Delete all data, second step (PRD §6 Settings): the first step is the dialog on Settings.
 * Typing the word makes the last step deliberate.
 */
export default function DeleteAllDataScreen() {
  const styles = useStyles();
  const { deleteAllData } = useDatabase();
  const [typed, setTyped] = useState('');
  const [deleting, setDeleting] = useState(false);
  const ready = typed.trim().toUpperCase() === CONFIRM_WORD;

  return (
    <InfoPage title="Hapus semua data">
      <Paragraph>
        Ini langkah terakhir. Semua Pudar, tulisan, catatan perasaan, draf, dan pengaturan akan terhapus dari HP
        ini, dan Pudar kembali seperti baru dipasang.
      </Paragraph>
      <Paragraph>Tidak ada yang bisa dipulihkan setelah ini.</Paragraph>

      <View style={styles.field}>
        <AppText variant="label" nativeID="confirm-word-label">
          Ketik {CONFIRM_WORD} untuk melanjutkan
        </AppText>
        <TextInput
          value={typed}
          onChangeText={setTyped}
          autoCapitalize="characters"
          autoCorrect={false}
          autoComplete="off"
          spellCheck={false}
          editable={!deleting}
          accessibilityLabelledBy="confirm-word-label"
          accessibilityLabel={`Ketik ${CONFIRM_WORD} untuk melanjutkan`}
          style={styles.input}
        />
      </View>

      <View style={styles.actions}>
        <PrimaryButton
          label="Hapus semua data"
          destructive
          disabled={!ready || deleting}
          onPress={() => {
            setDeleting(true);
            deleteAllData();
          }}
        />
        <SecondaryButton label="Batal" onPress={() => router.back()} />
      </View>
    </InfoPage>
  );
}

const useStyles = createStyles((colors) => ({
  field: {
    gap: spacing.sm,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 4,
    fontFamily: fonts.sansMedium,
    fontSize: 17,
    letterSpacing: 2,
    color: colors.text,
  },
  actions: {
    gap: spacing.sm,
  },
}));
