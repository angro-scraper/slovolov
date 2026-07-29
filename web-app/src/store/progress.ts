import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { isCommerceEnabled } from '../config/commerce';
import { recordLearningAttempt, type LearningStats } from '../domain/learning';

export type AccessibilitySettings = {
  reducedMotion: boolean;
  highContrast: boolean;
  largeText: boolean;
  dyslexiaFriendly: boolean;
};

export type ChildProfile = {
  id: string;
  name: string;
  avatar: string;
  learnedLetters: string[];
  learnedNumbers: number[];
  completedReading: string[];
  storyBookmarks: Record<string, number>;
  completedDailyChallenges: string[];
  completedGames: string[];
  completedLearningPaths: string[];
  savedCreations: string[];
  skillStats: LearningStats;
  learningSeconds: number;
  difficulty: 'easy' | 'standard' | 'challenge';
  stars: number;
  streak: number;
  medals: string[];
};

export type FamilyAccess = {
  isUnlocked: boolean;
  source: 'free' | 'store';
  verifiedAt?: string;
};

type ProgressState = {
  profiles: ChildProfile[];
  activeProfileId: string;
  soundEnabled: boolean;
  darkMode: boolean;
  script: 'cyrillic' | 'latin';
  accessibility: AccessibilitySettings;
  microphonePracticeEnabled: boolean;
  parentLanguage: 'sr' | 'en' | 'de' | 'fr';
  familyAccess: FamilyAccess;
  profile: ChildProfile;
  learnLetter: (letter: string) => void;
  learnNumber: (number: number) => void;
  completeReading: (levelId: string) => void;
  setStoryBookmark: (storyId: string, sentenceIndex: number) => void;
  completeDailyChallenge: (dateKey: string) => void;
  completeGame: (gameId: string) => void;
  completeLearningPath: (lessonId: string) => void;
  saveCreation: (sentence: string) => void;
  recordSkillAttempt: (skill: string, success: boolean) => void;
  addLearningSeconds: (seconds: number) => void;
  setDifficulty: (difficulty: ChildProfile['difficulty']) => void;
  setAccessibility: (settings: AccessibilitySettings) => void;
  setMicrophonePracticeEnabled: (enabled: boolean) => void;
  setParentLanguage: (language: ProgressState['parentLanguage']) => void;
  addProfile: (name: string, avatar: string) => boolean;
  renameProfile: (id: string, name: string) => boolean;
  setActiveProfile: (id: string) => void;
  toggleSound: () => void;
  toggleTheme: () => void;
  toggleScript: () => void;
  grantFamilyAccess: (source: 'store') => void;
  resetLearningProgress: () => void;
  reset: () => void;
};

const initialProfile: ChildProfile = {
  id: 'local-child',
  name: 'Мила',
  avatar: '🦊',
  learnedLetters: [],
  learnedNumbers: [],
  completedReading: [],
  storyBookmarks: {},
  completedDailyChallenges: [],
  completedGames: [],
  completedLearningPaths: [],
  savedCreations: [],
  skillStats: {},
  learningSeconds: 0,
  difficulty: 'standard',
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
  ,
  accessibility: {
    reducedMotion: false,
    highContrast: false,
    largeText: false,
    dyslexiaFriendly: false
  },
  microphonePracticeEnabled: false,
  parentLanguage: 'sr' as const,
  familyAccess: {
    isUnlocked: false,
    source: 'free' as const
  }
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
      learnNumber: (number) => set((state) => {
        const profiles = state.profiles.map((profile) => {
          if (profile.id !== state.activeProfileId || profile.learnedNumbers.includes(number)) return profile;
          return {
            ...profile,
            learnedNumbers: [...profile.learnedNumbers, number],
            stars: profile.stars + 1
          };
        });
        return { profiles, profile: profiles.find((item) => item.id === state.activeProfileId) ?? profiles[0] };
      }),
      completeReading: (levelId) => set((state) => {
        const profiles = state.profiles.map((profile) => {
          if (profile.id !== state.activeProfileId || profile.completedReading.includes(levelId)) return profile;
          return {
            ...profile,
            completedReading: [...profile.completedReading, levelId],
            stars: profile.stars + 1
          };
        });
        return { profiles, profile: profiles.find((item) => item.id === state.activeProfileId) ?? profiles[0] };
      }),
      setStoryBookmark: (storyId, sentenceIndex) => set((state) => {
        const profiles = state.profiles.map((profile) => (
          profile.id === state.activeProfileId
            ? { ...profile, storyBookmarks: { ...profile.storyBookmarks, [storyId]: Math.max(0, sentenceIndex) } }
            : profile
        ));
        return { profiles, profile: profiles.find((item) => item.id === state.activeProfileId) ?? profiles[0] };
      }),
      completeDailyChallenge: (dateKey) => set((state) => {
        const profiles = state.profiles.map((profile) => {
          if (profile.id !== state.activeProfileId || profile.completedDailyChallenges.includes(dateKey)) return profile;
          return {
            ...profile,
            completedDailyChallenges: [...profile.completedDailyChallenges, dateKey],
            stars: profile.stars + 3,
            streak: profile.streak + 1
          };
        });
        return { profiles, profile: profiles.find((item) => item.id === state.activeProfileId) ?? profiles[0] };
      }),
      completeGame: (gameId) => set((state) => {
        const profiles = state.profiles.map((profile) => {
          if (profile.id !== state.activeProfileId || profile.completedGames.includes(gameId)) return profile;
          return {
            ...profile,
            completedGames: [...profile.completedGames, gameId],
            stars: profile.stars + 2
          };
        });
        return { profiles, profile: profiles.find((item) => item.id === state.activeProfileId) ?? profiles[0] };
      }),
      completeLearningPath: (lessonId) => set((state) => {
        const profiles = state.profiles.map((profile) => {
          if (profile.id !== state.activeProfileId || profile.completedLearningPaths.includes(lessonId)) return profile;
          return {
            ...profile,
            completedLearningPaths: [...profile.completedLearningPaths, lessonId],
            stars: profile.stars + 3
          };
        });
        return { profiles, profile: profiles.find((item) => item.id === state.activeProfileId) ?? profiles[0] };
      }),
      saveCreation: (sentence) => set((state) => {
        const cleanSentence = sentence.trim().slice(0, 1800);
        if (!cleanSentence) return state;
        const profiles = state.profiles.map((profile) => (
          profile.id === state.activeProfileId
            ? { ...profile, savedCreations: [...profile.savedCreations, cleanSentence].slice(-20) }
            : profile
        ));
        return { profiles, profile: profiles.find((item) => item.id === state.activeProfileId) ?? profiles[0] };
      }),
      recordSkillAttempt: (skill, success) => set((state) => {
        const profiles = state.profiles.map((profile) => (
          profile.id === state.activeProfileId
            ? { ...profile, skillStats: recordLearningAttempt(profile.skillStats, skill, success) }
            : profile
        ));
        return { profiles, profile: profiles.find((item) => item.id === state.activeProfileId) ?? profiles[0] };
      }),
      addLearningSeconds: (seconds) => set((state) => {
        const safeSeconds = Math.max(0, Math.round(seconds));
        const profiles = state.profiles.map((profile) => (
          profile.id === state.activeProfileId
            ? { ...profile, learningSeconds: profile.learningSeconds + safeSeconds }
            : profile
        ));
        return { profiles, profile: profiles.find((item) => item.id === state.activeProfileId) ?? profiles[0] };
      }),
      setDifficulty: (difficulty) => set((state) => {
        const profiles = state.profiles.map((profile) => (
          profile.id === state.activeProfileId ? { ...profile, difficulty } : profile
        ));
        return { profiles, profile: profiles.find((item) => item.id === state.activeProfileId) ?? profiles[0] };
      }),
      setAccessibility: (accessibility) => set({ accessibility }),
      setMicrophonePracticeEnabled: (microphonePracticeEnabled) => set({ microphonePracticeEnabled }),
      setParentLanguage: (parentLanguage) => set({ parentLanguage }),
      addProfile: (name, avatar) => {
        const cleanName = name.trim().slice(0, 32);
        if (!cleanName || (
          isCommerceEnabled()
          && get().profiles.length >= 1
          && !get().familyAccess.isUnlocked
        )) return false;
        set((state) => {
        const profile = { ...initialProfile, id: crypto.randomUUID(), name: cleanName, avatar };
        return { profiles: [...state.profiles, profile], activeProfileId: profile.id, profile };
        });
        return true;
      },
      renameProfile: (id, name) => {
        const cleanName = name.trim().slice(0, 32);
        if (!cleanName) return false;
        set((state) => {
          const profiles = state.profiles.map((profile) => (
            profile.id === id ? { ...profile, name: cleanName } : profile
          ));
          return {
            profiles,
            profile: profiles.find((profile) => profile.id === state.activeProfileId) ?? state.profile
          };
        });
        return true;
      },
      setActiveProfile: (activeProfileId) => set((state) => ({
        activeProfileId,
        profile: state.profiles.find((item) => item.id === activeProfileId) ?? state.profile
      })),
      toggleSound: () => set((state) => ({ soundEnabled: !state.soundEnabled })),
      toggleTheme: () => set((state) => ({ darkMode: !state.darkMode })),
      toggleScript: () => set((state) => ({ script: state.script === 'cyrillic' ? 'latin' : 'cyrillic' })),
      grantFamilyAccess: (source) => set({
        familyAccess: {
          isUnlocked: true,
          source,
          verifiedAt: new Date().toISOString()
        }
      }),
      resetLearningProgress: () => set((state) => ({
        ...initial,
        familyAccess: state.familyAccess
      })),
      reset: () => set(initial)
    }),
    {
      name: 'slovolov-progress-v2',
      version: 7,
      migrate: (persisted) => {
        const state = persisted as Partial<ProgressState>;
        const profiles = (state.profiles ?? [initialProfile]).map((profile) => ({
          ...initialProfile,
          ...profile,
          learnedLetters: profile.learnedLetters ?? [],
          learnedNumbers: profile.learnedNumbers ?? [],
          completedReading: profile.completedReading ?? [],
          storyBookmarks: profile.storyBookmarks ?? {},
          completedDailyChallenges: profile.completedDailyChallenges ?? [],
          completedGames: profile.completedGames ?? [],
          completedLearningPaths: profile.completedLearningPaths ?? [],
          savedCreations: profile.savedCreations ?? [],
          skillStats: profile.skillStats ?? {},
          learningSeconds: profile.learningSeconds ?? 0,
          difficulty: profile.difficulty ?? 'standard',
          medals: profile.medals ?? []
        }));
        const activeProfileId = state.activeProfileId ?? profiles[0].id;
        return {
          profiles,
          activeProfileId,
          profile: profiles.find((profile) => profile.id === activeProfileId) ?? profiles[0],
          soundEnabled: state.soundEnabled ?? true,
          darkMode: state.darkMode ?? false,
          script: state.script ?? 'cyrillic',
          accessibility: state.accessibility ?? initial.accessibility,
          microphonePracticeEnabled: state.microphonePracticeEnabled ?? false,
          parentLanguage: state.parentLanguage ?? 'sr',
          familyAccess: state.familyAccess ?? initial.familyAccess
        };
      },
      partialize: ({
        profiles,
        activeProfileId,
        profile,
        soundEnabled,
        darkMode,
        script,
        accessibility,
        microphonePracticeEnabled,
        parentLanguage,
        familyAccess
      }) => ({
        profiles,
        activeProfileId,
        profile,
        soundEnabled,
        darkMode,
        script,
        accessibility,
        microphonePracticeEnabled,
        parentLanguage,
        familyAccess
      })
    }
  )
);
