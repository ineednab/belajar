import * as Crypto from 'expo-crypto';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import {
  createProfile,
  deleteProfile,
  loadProfilesSnapshot,
  persistActiveProfileId,
  startAgainToday,
  updateProfile,
  type Profile,
  type ProfilesSnapshot,
} from '@/db/profiles';
import { useDatabase } from '@/db/provider';
import { todayLocal } from '@/lib/date';
import type { ProfileInput } from '@/lib/profile';

type ProfilesContextValue = {
  profiles: Profile[];
  activeProfile: Profile | null;
  create(input: ProfileInput): Promise<Profile>;
  update(id: string, input: ProfileInput): Promise<void>;
  remove(id: string): Promise<void>;
  setActive(id: string): Promise<void>;
  startAgain(id: string): Promise<void>;
};

const ProfilesContext = createContext<ProfilesContextValue | null>(null);

/**
 * Profiles and the active profile for the whole app. Every mutation re-reads the snapshot
 * from the database, so the UI always reflects what is stored.
 */
export function ProfilesProvider({ children }: { children: ReactNode }) {
  const { db } = useDatabase();
  const [snapshot, setSnapshot] = useState<ProfilesSnapshot | null>(null);

  const reload = useCallback(async () => {
    setSnapshot(await loadProfilesSnapshot(db));
  }, [db]);

  useEffect(() => {
    let cancelled = false;
    loadProfilesSnapshot(db).then((initial) => {
      if (!cancelled) setSnapshot(initial);
    });
    return () => {
      cancelled = true;
    };
  }, [db]);

  const value = useMemo<ProfilesContextValue | null>(() => {
    if (!snapshot) {
      return null;
    }
    const clock = () => ({ now: Date.now(), today: todayLocal() });
    return {
      profiles: snapshot.profiles,
      activeProfile: snapshot.profiles.find((p) => p.id === snapshot.activeProfileId) ?? null,
      async create(input) {
        const profile = await createProfile(db, input, { id: Crypto.randomUUID(), ...clock() });
        await persistActiveProfileId(db, profile.id); // a new Pudar becomes the one you're in
        await reload();
        return profile;
      },
      async update(id, input) {
        await updateProfile(db, id, input, clock());
        await reload();
      },
      async remove(id) {
        await deleteProfile(db, id);
        await reload(); // loadProfilesSnapshot picks and persists the next active profile
      },
      async setActive(id) {
        await persistActiveProfileId(db, id);
        await reload();
      },
      async startAgain(id) {
        await startAgainToday(db, id, clock());
        await reload();
      },
    };
  }, [db, reload, snapshot]);

  if (!value) {
    return null;
  }
  return <ProfilesContext.Provider value={value}>{children}</ProfilesContext.Provider>;
}

export function useProfiles(): ProfilesContextValue {
  const value = useContext(ProfilesContext);
  if (!value) {
    throw new Error('useProfiles must be used inside <ProfilesProvider>.');
  }
  return value;
}
