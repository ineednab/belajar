import * as WebBrowser from 'expo-web-browser';
import { Linking, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { InfoPage, InfoSection, Paragraph } from '@/components/info-page';
import { PrimaryButton } from '@/components/primary-button';
import { SecondaryButton } from '@/components/secondary-button';
import { ICONS } from '@/theme/icons';
import { spacing } from '@/theme/tokens';

const HELPLINE_DIRECTORY = 'https://findahelpline.com';
const EMERGENCY_NUMBER = '112';

/** Settings → "If you're struggling" (PRD §6 Settings, D17). Copy to be reviewed (Q5). */
export default function SupportScreen() {
  return (
    <InfoPage title="Kalau kamu sedang berat">
      <Paragraph>
        Kehilangan seseorang bisa terasa sangat berat, dan itu wajar. Kamu tidak harus melewatinya sendirian.
      </Paragraph>
      <Paragraph>
        Kalau perasaanmu terlalu berat untuk ditanggung, bicara dengan seseorang bisa membantu: teman yang kamu
        percaya, keluarga, atau tenaga profesional.
      </Paragraph>

      <InfoSection title="Layanan bantuan">
        <Paragraph>
          Find a Helpline berisi daftar layanan bantuan yang gratis dan rahasia, di Indonesia dan negara lain.
        </Paragraph>
        <View style={styles.action}>
          <PrimaryButton
            label="Cari layanan bantuan"
            icon={ICONS.external}
            onPress={() => WebBrowser.openBrowserAsync(HELPLINE_DIRECTORY)}
          />
        </View>
      </InfoSection>

      <InfoSection title="Dalam keadaan darurat">
        <Paragraph>
          Kalau kamu merasa tidak aman atau ingin menyakiti diri sendiri, hubungi {EMERGENCY_NUMBER} atau pergi
          ke IGD terdekat sekarang.
        </Paragraph>
        <View style={styles.action}>
          <SecondaryButton
            label={`Telepon ${EMERGENCY_NUMBER}`}
            icon={ICONS.phone}
            onPress={() => Linking.openURL(`tel:${EMERGENCY_NUMBER}`)}
          />
        </View>
      </InfoSection>

      <AppText variant="caption">
        Pudar adalah tempat untuk menulis, bukan pengganti bantuan profesional atau layanan darurat.
      </AppText>
    </InfoPage>
  );
}

const styles = StyleSheet.create({
  action: {
    marginTop: spacing.xs,
  },
});
