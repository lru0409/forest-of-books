import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import { GENRES } from '@/lib';

interface SignupData {
  // Email Password Step
  email: string;
  password: string;
  confirmPassword: string;
  // Social Login Step
  isSocialLogin: boolean;
  // Profile Step
  nickname: string;
  bio: string;
  profileImage: { kind: 'default'; index: number } | { kind: 'uploaded'; file: File };
  // Genres Step
  genres: (typeof GENRES)[number][];
}

interface SignupActions {
  update: (data: Partial<SignupData>) => void;
  reset: () => void;
}

const partializeSignupData = (state: SignupData & SignupActions): Partial<SignupData> => ({
  email: state.email,
  password: state.password,
  confirmPassword: state.confirmPassword,
  isSocialLogin: state.isSocialLogin,
  nickname: state.nickname,
  bio: state.bio,
  genres: state.genres,
});

const initialState: SignupData = {
  email: '',
  password: '',
  confirmPassword: '',
  isSocialLogin: false,
  nickname: '',
  bio: '',
  profileImage: { kind: 'default', index: 0 },
  genres: [],
};

export const useSignupStore = create<SignupData & SignupActions>()(
  persist(
    (set) => ({
      ...initialState,
      update: (data) => set(data),
      reset: () => set(initialState),
    }),
    {
      name: 'signup',
      storage: createJSONStorage(() => sessionStorage),
      // TODO: profileImage는 즉시 서버 업로드 및 URL 받아서 사용 + BE 업로드 엔드포인트 개발 및 고아 파일 정리 로직 구현
      partialize: partializeSignupData,
    },
  ),
);
