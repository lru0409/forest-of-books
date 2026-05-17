import { z } from 'zod';

export const emailPasswordSchema = z
  .object({
    email: z
      .string()
      .min(1, '이메일을 입력해 주세요.')
      .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, '올바른 이메일 형식을 입력해 주세요.'),
    password: z
      .string()
      .min(1, '비밀번호를 입력해 주세요.')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,16}$/,
        '8~16자의 영문 대소문자, 숫자, 특수문자를 조합해 주세요.',
      ),
    confirmPassword: z.string().min(1, '비밀번호를 한 번 더 입력해 주세요.'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: '비밀번호가 일치하지 않습니다.',
    path: ['confirmPassword'],
  });

export const profileSchema = z.object({
  nickname: z
    .string()
    .min(1, '닉네임을 입력해 주세요.')
    .regex(/^[가-힣a-zA-Z0-9]{2,12}$/, '2~12자의 한글, 영문, 숫자만 입력해 주세요.'),
  bio: z.string().max(160, '최대 160자까지 입력할 수 있어요.'),
});

export type EmailPasswordFormData = z.infer<typeof emailPasswordSchema>;
export type ProfileFormData = z.infer<typeof profileSchema>;
