import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { todayLocal, type LocalDate } from '@/lib/date';

/** Today's local date, refreshed whenever the app returns to the foreground. */
export function useLocalToday(): LocalDate {
  const [today, setToday] = useState(todayLocal);
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') setToday(todayLocal());
    });
    return () => subscription.remove();
  }, []);
  return today;
}
