import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ChildProfile = {
  id: string;
  name: string;
  avatar: string;
  learnedLetters: string[];
  stars: number;
  streak: number;
  medals: string[];
};

type ProgressState = {
  profiles: ChildProfile[];
  activeProfileId: string;
  soundEnabled: boolean;
  darkMode: boolean;
  script: 'cyrillic' | 'latin';
  profile: ChildProfile;
  learnLetter: (letter: string) => void;
  addProfile: (name: string, avatar: string) => void;
  setActiveProfile: (id: string) => void;
  toggleSound: () => void;
  toggleTheme: () => void;
  toggleScript: () => void;
  reset: () => void;
};

const initialProfile: ChildProfile = {
  id: 'local-child',
  name: 'Мила',
  avatar: '🦊',
  learnedLetters: [],
  stars: 0,
  streak: 1,
  medals: []
};

const initial = {
  profiles: [initialProfile],
  activeProfileId: initialProfile.id,
  profile: initialProfile,
  soundEnabled: true,
  darkMode: false,
  script: 'cyrillic' as const
};

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      ...initial,
      learnLetter: (letter) => set((state) => {
        const profiles = state.profiles.map((profile) => {
          if (profile.id !== state.activeProfileId || profile.learnedLetters.includes(letter)) return profile;
          const learnedLetters = [...profile.learnedLetters, letter];
          const medals = learnedLetters.length >= 30
            ? ['Бронза', 'Сребро', 'Злато']
            : learnedLetters.length >= 15
              ? ['Бронза', 'Сребро']
              : learnedLetters.length >= 5 ? ['Бронза'] : [];
          return { ...profile, learnedLetters, stars: profile.stars + 1, medals };
        });
        return { profiles, profile: profiles.find((item) => item.id === state.activeProfileId) ?? profiles[0] };
      }),
      addProfile: (name, avatar) => set((state) => {
        const profile = { ...initialProfile, id: crypto.randomUUID(), name, avatar };
        return { profiles: [...state.profiles, profile], activeProfileId: profile.id, profile };
      }),
      setActiveProfile: (activeProfileId) => set((state) => ({
        activeProfileId,
        profile: state.profiles.find((item) => item.id === activeProfileId) ?? state.profile
      })),
      toggleSound: () => set((state) => ({ soundEnabled: !state.soundEnabled })),
      toggleTheme: () => set((state) => ({ darkMode: !state.darkMode })),
      toggleScript: () => set((state) => ({ script: state.script === 'cyrillic' ? 'latin' : 'cyrillic' })),
      reset: () => set(initial)
    }),
    {
      name: 'slovolov-progress-v2',
      partialize: ({ profiles, activeProfileId, profile, soundEnabled, darkMode, script }) => ({
        profiles, activeProfileId, profile, soundEnabled, darkMode, script
      })
    }
  )
);
