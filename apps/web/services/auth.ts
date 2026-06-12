import type { Genre, ApiResponse } from '@/lib';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

interface SocialRegisterPayload {
  nickname: string;
  bio: string;
  // profileImageUrl?: string;
  preferredGenres: Genre[];
}

async function socialRegister(
  payload: SocialRegisterPayload,
): Promise<ApiResponse<{ token: string }>> {
  const res = await fetch(`${API_URL}/auth/social/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    return { isSuccess: false, statusCode: res.status };
  }
  return { isSuccess: true, statusCode: res.status, data: (await res.json()) as { token: string } };
}

interface RegisterPayload {
  email: string;
  password: string;
  nickname: string;
  bio: string;
  preferredGenres: Genre[];
}

async function generalRegister(payload: RegisterPayload): Promise<ApiResponse<{ token: string }>> {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    return { isSuccess: false, statusCode: res.status };
  }
  return { isSuccess: true, statusCode: res.status, data: (await res.json()) as { token: string } };
}

async function checkNickname(nickname: string): Promise<ApiResponse<{ available: boolean }>> {
  const res = await fetch(
    `${API_URL}/auth/check-nickname?nickname=${encodeURIComponent(nickname)}`,
  );
  if (!res.ok) {
    return { isSuccess: false, statusCode: res.status };
  }
  return {
    isSuccess: true,
    statusCode: res.status,
    data: (await res.json()) as { available: boolean },
  };
}

async function sendEmailVerificationCode(email: string): Promise<ApiResponse> {
  const res = await fetch(`${API_URL}/auth/email-verifications`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    return { isSuccess: false, statusCode: res.status };
  }
  return { isSuccess: true, statusCode: res.status };
}

interface EmailVerificationCodeMismatchData {
  attemptCount: number;
  maxAttempts: number;
}

async function verifyEmailCode(
  email: string,
  code: string,
): Promise<ApiResponse<undefined, EmailVerificationCodeMismatchData>> {
  const res = await fetch(`${API_URL}/auth/email-verifications/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, code }),
  });
  if (!res.ok) {
    const body = (await res.json()) as {
      errorCode?: string;
      data?: EmailVerificationCodeMismatchData;
    };
    return {
      isSuccess: false,
      statusCode: res.status,
      errorCode: body.errorCode,
      data: body.data,
    };
  }
  return { isSuccess: true, statusCode: res.status };
}

export default {
  socialRegister,
  generalRegister,
  checkNickname,
  sendEmailVerificationCode,
  verifyEmailCode,
};
