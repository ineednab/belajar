import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import type { MORE_QUICK_LOG_KEYS, QuickLogKey, QuickLogs } from '@/db/day-records';
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

/** Behind "Lainnya" (PRD D22). The list is nabila's call (open question Q8). */
export const MORE_QUICK_LOGS: readonly { key: (typeof MORE_QUICK_LOG_KEYS)[number]; label: string }[] = [
  { key: 'wantedToChat', label: 'Ingin chat dia' },
  { key: 'checkedSocials', label: 'Lihat media sosialnya' },
  { key: 'missedThem', label: 'Kangen' },
  { key: 'feltAngry', label: 'Marah' },
  { key: 'feltRelieved', label: 'Merasa lega' },
  { key: 'sleptWell', label: 'Tidur nyenyak' },
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
  const moreOn = MORE_QUICK_LOGS.filter(({ key }) => value[key]).length;
  const [showMore, setShowMore] = useState(false);
  return (
    <View style={styles.wrap}>
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
      {readOnly ? (
        <MoreQuickLogChips value={value} />
      ) : (
        <>
          <Pressable
            onPress={() => setShowMore((open) => !open)}
            accessibilityRole="button"
            accessibilityState={{ expanded: showMore }}
            accessibilityLabel={moreOn > 0 ? `Lainnya, ${moreOn} dipilih` : 'Lainnya'}
            hitSlop={8}
            style={({ pressed }) => [styles.moreToggle, pressed && styles.pressed]}>
            <AppText style={styles.moreToggleText}>{moreOn > 0 ? `Lainnya · ${moreOn}` : 'Lainnya'}</AppText>
            <View style={showMore && styles.flipped}>
              <Icon icon={ICONS.chevronDown} size={14} color={colors.primaryInk} />
            </View>
          </Pressable>
          {showMore && (
            <View style={styles.chips}>
              {MORE_QUICK_LOGS.map(({ key, label }) => {
                const selected = value[key];
                return (
                  <Pressable
                    key={key}
                    onPress={() => onToggle?.(key)}
                    accessibilityRole="button"
                    accessibilityLabel={label}
                    accessibilityState={{ selected }}
                    style={({ pressed }) => [
                      styles.chip,
                      selected && styles.chipOn,
                      pressed && styles.pressed,
                    ]}>
                    {selected && <Icon icon={ICONS.check} size={14} color={colors.onPrimaryInk} />}
                    <AppText style={[styles.chipText, selected && styles.chipTextOn]}>{label}</AppText>
                  </Pressable>
                );
              })}
            </View>
          )}
        </>
      )}
    </View>
  );
}

/** Read-only chips for the "Lainnya" logs that were on (past days, entry detail). */
export function MoreQuickLogChips({
  value,
  align = 'center',
}: {
  value: QuickLogs;
  align?: 'center' | 'start';
}) {
  const on = MORE_QUICK_LOGS.filter(({ key }) => value[key]);
  if (on.length === 0) return null;
  return (
    <View style={[styles.chips, align === 'start' && styles.chipsStart]}>
      {on.map(({ key, label }) => (
        <View key={key} style={[styles.chip, styles.chipStatic]}>
          <AppText style={styles.chipText}>{label}</AppText>
        </View>
      ))}
    </View>
  );
}

/** Small read-only icons for the quick logs that were on, used inside entry cards. */
export function QuickLogIcons({ value }: { value: QuickLogs }) {
  const on = QUICK_LOGS.filter(({ key }) => value[key]);
  const more = MORE_QUICK_LOGS.filter(({ key }) => value[key]);
  if (on.length === 0 && more.length === 0) {
    return null;
  }
  return (
    <View
      style={styles.mini}
      accessible
      accessibilityLabel={[...on, ...more].map(({ label }) => label).join(', ')}>
      {on.map(({ key, icon, tone }) => (
        <View key={key} style={[styles.miniCircle, { backgroundColor: tone.bg }]}>
          <Icon icon={icon} size={16} color={tone.ink} />
        </View>
      ))}
      {more.length > 0 && (
        <View style={[styles.miniCircle, styles.miniMore]}>
          <AppText style={styles.miniMoreText}>+{more.length}</AppText>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.md,
  },
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
  moreToggle: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  moreToggleText: {
    fontFamily: fonts.sansMedium,
    fontSize: 14,
    lineHeight: 18,
    color: colors.primaryInk,
  },
  flipped: {
    transform: [{ rotate: '180deg' }],
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  chipsStart: {
    justifyContent: 'flex-start',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipOn: {
    borderColor: colors.primaryInk,
    backgroundColor: colors.primaryInk,
  },
  chipStatic: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm + 4,
    backgroundColor: colors.neutralBg,
    borderColor: colors.neutralBg,
  },
  chipText: {
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 18,
    color: colors.text,
  },
  chipTextOn: {
    color: colors.onPrimaryInk,
  },
  miniMore: {
    backgroundColor: colors.neutralBg,
  },
  miniMoreText: {
    fontFamily: fonts.sansMedium,
    fontSize: 12,
    lineHeight: 16,
    color: colors.text,
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
