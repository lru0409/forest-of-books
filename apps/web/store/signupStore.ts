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
  profileImageUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/images/profile-defaults/1.png`,
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
      partialize: partializeSignupData,
    },
  ),
);
