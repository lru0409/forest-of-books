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
  profileImageIndex: number;
  // Genres Step
  genres: (typeof GENRES)[number][];
}

interface SignupActions {
  setEmailPasswordStep: (data: Pick<SignupData, 'email' | 'password' | 'confirmPassword'>) => void;
  setProfileStep: (data: Pick<SignupData, 'nickname' | 'bio' | 'profileImageIndex'>) => void;
  setGenresStep: (data: Pick<SignupData, 'genres'>) => void;
  reset: () => void;
}

const initialState: SignupData = {
  email: '',
  password: '',
  confirmPassword: '',
  nickname: '',
  bio: '',
  profileImageIndex: 0,
  genres: [],
};

export const useSignupStore = create<SignupData & SignupActions>()(
  persist(
    (set) => ({
      ...initialState,
      setEmailPasswordStep: (data) => set(data),
      setProfileStep: (data) => set(data),
      setGenresStep: (data) => set(data),
      reset: () => set(initialState),
    }),
    {
      name: 'signup',
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
);
