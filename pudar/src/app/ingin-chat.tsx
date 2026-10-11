import * as Crypto from 'expo-crypto';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { JournalEditor } from '@/components/journal-editor';
import { PrimaryButton } from '@/components/primary-button';
import { Screen } from '@/components/screen';
import { SecondaryButton } from '@/components/secondary-button';
import { createEntry } from '@/db/entries';
import { useDatabase } from '@/db/provider';
import { formatCountdown } from '@/lib/countdown';
import { todayLocal } from '@/lib/date';
import { useProfiles } from '@/profiles/provider';
import { ICONS } from '@/theme/icons';
import { spacing } from '@/theme/tokens';
import { createStyles } from '@/theme/theme';
import { fonts } from '@/theme/typography';

/** How long Pudar asks the person to wait before deciding (PRD §6 "Ingin chat dia"). */
const WAIT_SECONDS = 10 * 60;
const BREATH_SECONDS = 4;

/**
 * The "Ingin chat dia" moment: write the message here instead of to them, breathe through a
 * ten-minute wait, then keep it as a journal entry or let it go. Nothing is stored until "Simpan".
 */
export default function WantToChatScreen() {
  const styles = useStyles();
  const { db } = useDatabase();
  const { activeProfile } = useProfiles();
  const [message, setMessage] = useState('');
  const [startedAt] = useState(() => Date.now());
  const [now, setNow] = useState(startedAt);
  const [scale] = useState(() => new Animated.Value(0.75));

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let loop: Animated.CompositeAnimation | null = null;
    AccessibilityInfo.isReduceMotionEnabled().then((reduce) => {
      if (reduce) return;
      const step = (toValue: number) =>
        Animated.timing(scale, {
          toValue,
          duration: BREATH_SECONDS * 1000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        });
      loop = Animated.loop(Animated.sequence([step(1), step(0.75)]));
      loop.start();
    });
    return () => loop?.stop();
  }, [scale]);

  const elapsed = (now - startedAt) / 1000;
  const remaining = WAIT_SECONDS - elapsed;
  const done = remaining <= 0;
  const breathingIn = Math.floor(elapsed / BREATH_SECONDS) % 2 === 0;

  const keep = async () => {
    if (!activeProfile) return;
    const at = Date.now();
    await createEntry(db, activeProfile.id, todayLocal(new Date(at)), message, {
      id: Crypto.randomUUID(),
      now: at,
    });
    router.back();
  };

  return (
    <Screen>
      <AppText variant="title" accessibilityRole="header">
        Tulis di sini, bukan ke dia.
      </AppText>
      <AppText variant="body">
        Pesan ini tidak dikirim ke siapa pun. Tulis semua yang ingin kamu katakan, lalu tunggu sebentar
        sebelum memutuskan.
      </AppText>

      <View
        style={styles.breath}
        accessible
        accessibilityLabel={done ? 'Sudah sepuluh menit.' : `Sisa ${formatCountdown(remaining)}`}>
        <Animated.View style={[styles.circle, { transform: [{ scale }] }]}>
          <AppText style={styles.time}>{done ? 'Selesai' : formatCountdown(remaining)}</AppText>
        </Animated.View>
        <AppText variant="caption" style={styles.center}>
          {done
            ? 'Sudah 10 menit. Bagaimana rasanya sekarang?'
            : breathingIn
              ? 'Tarik napas pelan…'
              : 'Hembuskan perlahan…'}
        </AppText>
      </View>

      <JournalEditor
        value={message}
        onChange={setMessage}
        locked={false}
        onLockedPress={() => {}}
        placeholder="Apa yang ingin kamu katakan padanya?"
        accessibilityLabel="Pesan untuknya"
      />

      <View style={styles.actions}>
        <SecondaryButton label="Lepaskan" icon={ICONS.letGo} onPress={() => router.back()} />
        <PrimaryButton label="Simpan sebagai tulisan" onPress={keep} disabled={message.trim().length === 0} />
      </View>
      <AppText variant="caption" style={styles.center}>
        Kalau dilepaskan, kata-katanya langsung hilang. Kalau disimpan, tulisannya memudar seperti tulisan
        lain dalam 30 hari.
      </AppText>
    </Screen>
  );
}

const useStyles = createStyles((colors) => ({
  breath: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  circle: {
    width: 132,
    height: 132,
    borderRadius: 66,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.roseBg,
  },
  time: {
    fontFamily: fonts.serif,
    fontSize: 30,
    lineHeight: 36,
    color: colors.primaryInk,
  },
  center: {
    textAlign: 'center',
  },
  actions: {
    gap: spacing.sm,
  },
}));
