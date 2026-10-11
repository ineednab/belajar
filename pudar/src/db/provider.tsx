import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { Alert, AppState } from 'react-native';

import { nativeDatabaseDeps } from './native';
import { deleteAllData, openEncryptedDatabase, type OpenedDatabase } from './open';
import { purgeExpired } from './purge';
import type { Db } from './types';

type DatabaseContextValue = {
  db: Db;
  encrypted: boolean;
  /** Bumped when a purge erased text while the app was running, so screens reload. */
  purgeVersion: number;
  /** "Hapus semua data": erases the file and key, then reopens as a first launch. */
  deleteAllData(): Promise<void>;
};

type OpenedValue = Omit<DatabaseContextValue, 'purgeVersion'>;

export type DatabaseState =
  | { status: 'loading' }
  | ({ status: 'ready' } & OpenedValue)
  | { status: 'error'; error: Error; retry: () => void };

const DatabaseContext = createContext<DatabaseContextValue | null>(null);

// One open per app process. expo-sqlite caches connections by name, so opening twice (e.g. a
// remounted effect) would share, and possibly close, the same native connection.
let opening: Promise<OpenedDatabase> | null = null;

function openOnce(): Promise<OpenedDatabase> {
  opening ??= openEncryptedDatabase(nativeDatabaseDeps)
    .then(async (opened) => {
      // Before the first screen reads anything (PRD §6 Purge).
      await purgeExpired(opened.db, Date.now());
      return opened;
    })
    .catch((error: unknown) => {
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

  const deleteAll = useCallback(async (db: Db) => {
    // Unmount every screen first, so nothing reads or writes while the connection closes.
    setState({ status: 'loading' });
    await new Promise((resolve) => setTimeout(resolve, 0));
    opening = null;
    try {
      await deleteAllData(db, nativeDatabaseDeps);
    } catch {
      Alert.alert(
        'Belum semua terhapus',
        'Ada data yang belum berhasil dihapus. Coba lagi dari Pengaturan.',
      );
    }
    setAttempt((n) => n + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    openOnce().then(
      ({ db, encrypted, resetUnreadable }) => {
        if (cancelled) {
          return;
        }
        setState({ status: 'ready', db, encrypted, deleteAllData: () => deleteAll(db) });
        if (resetUnreadable) {
          Alert.alert(
            'Memulai dari awal',
            'Jurnal lamamu tidak bisa dibaca di perangkat ini, jadi Pudar memulai jurnal baru.',
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
  }, [attempt, retry, deleteAll]);

  return state;
}

export function DatabaseProvider({ value, children }: { value: OpenedValue; children: ReactNode }) {
  const [purgeVersion, setPurgeVersion] = useState(0);
  const { db } = value;

  // Purge again whenever the app comes back to the foreground (PRD D11).
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active') return;
      purgeExpired(db, Date.now()).then((erased) => {
        if (erased > 0) setPurgeVersion((n) => n + 1);
      });
    });
    return () => subscription.remove();
  }, [db]);

  return (
    <DatabaseContext.Provider value={{ ...value, purgeVersion }}>{children}</DatabaseContext.Provider>
  );
}

export function useDatabase(): DatabaseContextValue {
  const value = useContext(DatabaseContext);
  if (!value) {
    throw new Error('useDatabase must be used inside <DatabaseProvider>.');
  }
  return value;
}
