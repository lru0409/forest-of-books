import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import { GENRES } from '@/lib';

interface SignupData {
  // Email Password Step
  email: string;
  password: string;
  confirmPassword: string;
  // Profile Step
  nickname: string;
  bio: string;
  profileImage: { kind: 'default'; index: number } | { kind: 'uploaded'; file: File };
  // Genres Step
  genres: (typeof GENRES)[number][];
}

interface SignupActions {
  setStep: (data: Partial<SignupData>) => void;
  reset: () => void;
}

const initialState: SignupData = {
  email: '',
  password: '',
  confirmPassword: '',
  nickname: '',
  bio: '',
  profileImage: { kind: 'default', index: 0 },
  genres: [],
};

export const useSignupStore = create<SignupData & SignupActions>()(
  persist(
    (set) => ({
      ...initialState,
      setStep: (data) => set(data),
      reset: () => set(initialState),
    }),
    {
      name: 'signup',
      storage: createJSONStorage(() => sessionStorage),
      partialize: ({ profileImage: _, ...rest }) => rest,
    },
  ),
);
