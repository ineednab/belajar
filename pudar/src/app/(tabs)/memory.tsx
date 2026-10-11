import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/app-text';
import { EmptyState } from '@/components/empty-state';
import { PrimaryButton } from '@/components/primary-button';
import { ProfileSelector } from '@/components/profile-selector';
import { Screen } from '@/components/screen';
import { StatusPill } from '@/components/status-pill';
import { TimelineCard } from '@/components/timeline-card';
import { listQuickLogs, type QuickLogs } from '@/db/day-records';
import { listEntriesForProfile, type JournalEntry } from '@/db/entries';
import { isClosed } from '@/db/profiles';
import { useDatabase } from '@/db/provider';
import { useLocalToday } from '@/hooks/use-local-today';
import { localDateToDate, type LocalDate } from '@/lib/date';
import { LOCALE } from '@/lib/locale';
import { useProfiles } from '@/profiles/provider';
import { ICONS } from '@/theme/icons';
import { spacing } from '@/theme/tokens';

type Timeline = {
  now: number;
  entries: JournalEntry[];
  quickLogs: Map<LocalDate, QuickLogs>;
};

/** Memory: every entry of the active Pudar, newest first, grouped by month (PRD §6). */
export default function MemoryScreen() {
  const { activeProfile } = useProfiles();
  const { db, purgeVersion } = useDatabase();
  const today = useLocalToday();
  const [timeline, setTimeline] = useState<Timeline | null>(null);
  const profileId = activeProfile?.id;

  // Reload each time the tab is shown, so new entries, Let Go and fading are reflected.
  useFocusEffect(
    useCallback(() => {
      if (!profileId) return;
      let cancelled = false;
      const now = Date.now();
      listEntriesForProfile(db, profileId, now).then(async (entries) => {
        const quickLogs =
          entries.length > 0
            ? await listQuickLogs(db, profileId, entries[entries.length - 1].date, entries[0].date)
            : new Map<LocalDate, QuickLogs>();
        if (!cancelled) setTimeline({ now, entries, quickLogs });
      });
      return () => {
        cancelled = true;
      };
      // purgeVersion isn't read, but a change means a foreground purge erased text: reload.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [db, profileId, purgeVersion]),
  );

  if (!activeProfile) {
    return <Screen>{null}</Screen>;
  }
  if (timeline !== null && timeline.entries.length === 0) {
    return (
      <Screen>
        <ProfileSelector profile={activeProfile} />
        <EmptyState
          icon={ICONS.leaf}
          title="Kenanganmu akan muncul di sini, perlahan memudar seiring waktu."
          body="Tulis tulisan pertamamu untuk mulai mengisi linimasa.">
          {!isClosed(activeProfile) && (
            <PrimaryButton label="Mulai menulis" onPress={() => router.navigate('/')} />
          )}
        </EmptyState>
      </Screen>
    );
  }

  return (
    <Screen>
      <ProfileSelector profile={activeProfile} />
      {isClosed(activeProfile) && <StatusPill text="Selesai" tone="neutral" />}
      {timeline &&
        groupByMonth(timeline.entries).map(({ month, entries }) => (
          <View key={month} style={styles.month}>
            <AppText variant="heading" accessibilityRole="header" style={styles.monthTitle}>
              {month}
            </AppText>
            {entries.map((entry) => (
              <TimelineCard
                key={entry.id}
                entry={entry}
                quickLogs={timeline.quickLogs.get(entry.date)}
                isToday={entry.date === today}
                now={timeline.now}
                onPress={() => router.push({ pathname: '/entry/[id]', params: { id: entry.id } })}
              />
            ))}
          </View>
        ))}
    </Screen>
  );
}

function groupByMonth(entries: JournalEntry[]): { month: string; entries: JournalEntry[] }[] {
  const groups: { month: string; entries: JournalEntry[] }[] = [];
  for (const entry of entries) {
    const month = localDateToDate(entry.date).toLocaleDateString(LOCALE, { month: 'long', year: 'numeric' });
    const last = groups[groups.length - 1];
    if (last?.month === month) {
      last.entries.push(entry);
    } else {
      groups.push({ month, entries: [entry] });
    }
  }
  return groups;
}

const styles = StyleSheet.create({
  month: {
    gap: spacing.sm,
  },
  monthTitle: {
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
});
