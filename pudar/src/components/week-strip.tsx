import { useEffect, useMemo, useState } from 'react';
import { PanResponder, Pressable, StyleSheet, View } from 'react-native';

import { addDays, compareLocalDates, localDateToDate, weekContaining, type LocalDate } from '@/lib/date';
import { colors, spacing } from '@/theme/tokens';
import { fonts } from '@/theme/typography';

import { AppText } from './app-text';

export type DayMark = { faded: boolean };

const SWIPE_DISTANCE = 40;

/**
 * Seven days of the selected week (PRD §6 Week strip). Swipe right for earlier weeks; it never
 * goes past the current week. Future days are shown but disabled. A filled dot marks a day with
 * an entry, a hollow dot one whose entry has faded.
 */
export function WeekStrip({
  selected,
  today,
  weekStartsOn,
  marks,
  onSelect,
  onWeekChange,
}: {
  selected: LocalDate;
  today: LocalDate;
  weekStartsOn: number;
  marks: Map<LocalDate, DayMark>;
  onSelect: (date: LocalDate) => void;
  /** Called with the first and last day whenever the visible week changes. */
  onWeekChange: (from: LocalDate, to: LocalDate) => void;
}) {
  const [anchor, setAnchor] = useState(selected);
  const [shownSelection, setShownSelection] = useState(selected);
  if (selected !== shownSelection) {
    // A new selection (e.g. the date changed at midnight) brings its week into view.
    setShownSelection(selected);
    setAnchor(selected);
  }

  const days = useMemo(() => weekContaining(anchor, weekStartsOn), [anchor, weekStartsOn]);
  const isCurrentWeek = days.includes(today);

  useEffect(() => {
    onWeekChange(days[0], days[6]);
  }, [days, onWeekChange]);

  const responder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 12 && Math.abs(g.dx) > Math.abs(g.dy),
        onPanResponderRelease: (_, g) => {
          if (g.dx > SWIPE_DISTANCE) {
            setAnchor(addDays(anchor, -7));
          } else if (g.dx < -SWIPE_DISTANCE && !isCurrentWeek) {
            setAnchor(addDays(anchor, 7));
          }
        },
      }),
    [anchor, isCurrentWeek],
  );

  return (
    <View style={styles.row} {...responder.panHandlers} accessibilityRole="tablist">
      {days.map((day) => {
        const date = localDateToDate(day);
        const future = compareLocalDates(day, today) > 0;
        const isSelected = day === selected;
        const mark = marks.get(day);
        const weekday = date.toLocaleDateString(undefined, { weekday: 'short' });
        return (
          <Pressable
            key={day}
            disabled={future}
            onPress={() => onSelect(day)}
            accessibilityRole="tab"
            accessibilityState={{ selected: isSelected, disabled: future }}
            accessibilityLabel={date.toLocaleDateString(undefined, {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}
            style={styles.day}>
            <AppText style={[styles.weekday, future && styles.future]}>{weekday}</AppText>
            <View style={[styles.number, isSelected && styles.numberSelected]}>
              <AppText
                style={[
                  styles.numberText,
                  isSelected && styles.numberTextSelected,
                  future && styles.future,
                ]}>
                {date.getDate()}
              </AppText>
            </View>
            <View style={[styles.dot, mark && (mark.faded ? styles.dotHollow : styles.dotFilled)]} />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  day: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
  },
  weekday: {
    fontFamily: fonts.sans,
    fontSize: 12,
    lineHeight: 16,
    color: colors.mutedInk,
  },
  number: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberSelected: {
    backgroundColor: colors.secondary,
  },
  numberText: {
    fontFamily: fonts.sansMedium,
    fontSize: 16,
    lineHeight: 20,
    color: colors.text,
  },
  numberTextSelected: {
    fontFamily: fonts.sansSemiBold,
  },
  future: {
    color: colors.muted,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotFilled: {
    backgroundColor: colors.primary,
  },
  dotHollow: {
    borderWidth: 1,
    borderColor: colors.primaryInk,
  },
});
