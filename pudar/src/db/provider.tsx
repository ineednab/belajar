import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { Alert } from 'react-native';

import { nativeDatabaseDeps } from './native';
import { openEncryptedDatabase, type OpenedDatabase } from './open';
import type { Db } from './types';

type DatabaseContextValue = { db: Db; encrypted: boolean };

export type DatabaseState =
  | { status: 'loading' }
  | ({ status: 'ready' } & DatabaseContextValue)
  | { status: 'error'; error: Error; retry: () => void };

const DatabaseContext = createContext<DatabaseContextValue | null>(null);

// One open per app process. expo-sqlite caches connections by name, so opening twice (e.g. a
// remounted effect) would share, and possibly close, the same native connection.
let opening: Promise<OpenedDatabase> | null = null;

function openOnce(): Promise<OpenedDatabase> {
  opening ??= openEncryptedDatabase(nativeDatabaseDeps).catch((error: unknown) => {
    opening = null; // allow retry
    throw error;
  });
  return opening;
}

/** Opens the database once for the app's lifetime. */
export function useOpenDatabase(): DatabaseState {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<DatabaseState>({ status: 'loading' });
  const retry = useCallback(() => {
    setState({ status: 'loading' });
    setAttempt((n) => n + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    openOnce().then(
      ({ db, encrypted, resetUnreadable }) => {
        if (cancelled) {
          return;
        }
        setState({ status: 'ready', db, encrypted });
        if (resetUnreadable) {
          Alert.alert(
            'Starting fresh',
            'Your previous journal could not be read on this device, so Pudar started a new one.',
          );
        }
      },
      (error: unknown) => {
        if (!cancelled) {
          setState({
            status: 'error',
            error: error instanceof Error ? error : new Error(String(error)),
            retry,
          });
        }
      },
    );
    return () => {
      cancelled = true;
    };
  }, [attempt, retry]);

  return state;
}

export function DatabaseProvider({
  value,
  children,
}: {
  value: DatabaseContextValue;
  children: ReactNode;
}) {
  return <DatabaseContext.Provider value={value}>{children}</DatabaseContext.Provider>;
}

export function useDatabase(): DatabaseContextValue {
  const value = useContext(DatabaseContext);
  if (!value) {
    throw new Error('useDatabase must be used inside <DatabaseProvider>.');
  }
  return value;
}
