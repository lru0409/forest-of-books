import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface SignupData {
  // Email Password Step
  email: string;
  emailVerified: boolean;
  password: string;
  confirmPassword: string;
  // Social Login Step
  isSocialLogin: boolean;
  // Profile Step
  nickname: string;
  nicknameVerified: boolean;
  bio: string;
  profileImageUrl: string;
}

interface SignupActions {
  update: (data: Partial<SignupData>) => void;
  reset: () => void;
}

const partializeSignupData = (state: SignupData & SignupActions): Partial<SignupData> => ({
  email: state.email,
  emailVerified: state.emailVerified,
  password: state.password,
  confirmPassword: state.confirmPassword,
  isSocialLogin: state.isSocialLogin,
  nickname: state.nickname,
  nicknameVerified: state.nicknameVerified,
  bio: state.bio,
  profileImageUrl: state.profileImageUrl,
});

const initialState: SignupData = {
  email: '',
  emailVerified: false,
  password: '',
  confirmPassword: '',
  isSocialLogin: false,
  nickname: '',
  nicknameVerified: false,
  bio: '',
  profileImageUrl: '',
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
