import { Pressable, StyleSheet, View } from 'react-native';

import type { QuickLogKey, QuickLogs } from '@/db/day-records';
import { ICONS, type IconSpec } from '@/theme/icons';
import { colors, spacing } from '@/theme/tokens';
import { fonts } from '@/theme/typography';

import { AppText } from './app-text';
import { Icon } from './icon';

type Tone = { bg: string; ink: string; selectedBg: string };

const NEUTRAL: Tone = { bg: colors.neutralBg, ink: colors.neutralIcon, selectedBg: colors.neutralIcon };
const SELF: Tone = { bg: colors.selfGreenBg, ink: colors.selfGreenInk, selectedBg: colors.selfGreenInk };

export const QUICK_LOGS: readonly { key: QuickLogKey; label: string; icon: IconSpec; tone: Tone }[] = [
  { key: 'thoughtOfThem', label: 'Memikirkannya', icon: ICONS.brain, tone: NEUTRAL },
  { key: 'hadACry', label: 'Menangis', icon: ICONS.rain, tone: NEUTRAL },
  { key: 'choseMyself', label: 'Memilih diriku', icon: ICONS.leaf, tone: SELF },
];

/**
 * The three quick-log toggles (PRD §6 Quick logs). Selection is shown with a filled circle and a
 * check badge, not color alone.
 */
export function QuickLogButtons({
  value,
  onToggle,
  readOnly = false,
}: {
  value: QuickLogs;
  onToggle?: (key: QuickLogKey) => void;
  readOnly?: boolean;
}) {
  return (
    <View style={styles.row}>
      {QUICK_LOGS.map(({ key, label, icon, tone }) => {
        const selected = value[key];
        return (
          <Pressable
            key={key}
            disabled={readOnly}
            onPress={() => onToggle?.(key)}
            accessibilityRole="button"
            accessibilityLabel={label}
            accessibilityState={{ selected, disabled: readOnly }}
            style={({ pressed }) => [styles.item, pressed && styles.pressed]}>
            <View style={[styles.circle, { backgroundColor: selected ? tone.selectedBg : tone.bg }]}>
              <Icon icon={icon} size={34} color={selected ? colors.onPrimaryInk : tone.ink} />
              {selected && (
                <View style={[styles.badge, { backgroundColor: tone.selectedBg }]}>
                  <Icon icon={ICONS.check} size={12} color={colors.onPrimaryInk} />
                </View>
              )}
            </View>
            <AppText style={styles.label}>{label}</AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Small read-only icons for the quick logs that were on, used inside entry cards. */
export function QuickLogIcons({ value }: { value: QuickLogs }) {
  const on = QUICK_LOGS.filter(({ key }) => value[key]);
  if (on.length === 0) {
    return null;
  }
  return (
    <View
      style={styles.mini}
      accessible
      accessibilityLabel={on.map(({ label }) => label).join(', ')}>
      {on.map(({ key, icon, tone }) => (
        <View key={key} style={[styles.miniCircle, { backgroundColor: tone.bg }]}>
          <Icon icon={icon} size={16} color={tone.ink} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  item: {
    alignItems: 'center',
    gap: spacing.sm,
    width: 112,
  },
  pressed: {
    opacity: 0.7,
  },
  circle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 19,
    color: colors.text,
    textAlign: 'center',
  },
  mini: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  miniCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
