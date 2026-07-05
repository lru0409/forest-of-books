import type { Genre, ApiResponse, User } from '@/lib';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

async function sendEmailVerificationCode(email: string): Promise<ApiResponse> {
  const res = await fetch(`${API_URL}/auth/email-verifications`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  return { isSuccess: res.ok, statusCode: res.status };
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
    const body = await res.json().catch(() => ({}));
    return {
      isSuccess: false,
      statusCode: res.status,
      errorCode: body.errorCode,
      data: body.data,
    };
  }
  return { isSuccess: true, statusCode: res.status };
}

async function checkNickname(nickname: string): Promise<ApiResponse<{ available: boolean }>> {
  const res = await fetch(
    `${API_URL}/auth/check-nickname?nickname=${encodeURIComponent(nickname)}`,
  );
  if (!res.ok) {
    return { isSuccess: false, statusCode: res.status };
  }
  const body = await res.json().catch(() => ({}));
  return {
    isSuccess: true,
    statusCode: res.status,
    data: body,
  };
}

async function uploadProfileImage(formData: FormData): Promise<ApiResponse<{ url: string }>> {
  const res = await fetch(`${API_URL}/upload/profile-image`, {
    method: 'POST',
    body: formData,
  });
  console.log('uploadProfileImage res:', res);
  if (!res.ok) {
    return { isSuccess: false, statusCode: res.status };
  }
  const body = await res.json().catch(() => ({}));
  console.log('uploadProfileImage body:', body);
  return { isSuccess: true, statusCode: res.status, data: body };
}

interface SocialRegisterPayload {
  nickname: string;
  bio: string;
  profileImageUrl: string;
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
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { isSuccess: false, statusCode: res.status, errorCode: body.errorCode };
  }
  return { isSuccess: true, statusCode: res.status, data: body };
}

interface RegisterPayload {
  email: string;
  password: string;
  nickname: string;
  bio: string;
  profileImageUrl: string;
  preferredGenres: Genre[];
}

async function generalRegister(payload: RegisterPayload): Promise<ApiResponse<{ token: string }>> {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { isSuccess: false, statusCode: res.status, errorCode: body.errorCode };
  }
  return { isSuccess: true, statusCode: res.status, data: body };
}

async function login(email: string, password: string): Promise<ApiResponse<{ token: string }>> {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { isSuccess: false, statusCode: res.status, errorCode: body.errorCode };
  }
  return { isSuccess: true, statusCode: res.status, data: body };
}

async function getMe(token: string | null): Promise<ApiResponse<User>> {
  const res = await fetch(`${API_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { isSuccess: false, statusCode: res.status, errorCode: body.errorCode };
  }
  return { isSuccess: true, statusCode: res.status, data: body };
}

export default {
  socialRegister,
  generalRegister,
  checkNickname,
  sendEmailVerificationCode,
  verifyEmailCode,
  uploadProfileImage,
  login,
  getMe,
};
