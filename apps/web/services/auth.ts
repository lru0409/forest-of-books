import { type Genre, type ApiResponse, type User, apiRequest } from '@/lib';

function sendEmailVerificationCode(email: string): Promise<ApiResponse> {
  return apiRequest('/auth/email-verifications', {
    method: 'POST',
    body: { email },
  });
}

interface EmailVerificationCodeMismatchData {
  attemptCount: number;
  maxAttempts: number;
}

function verifyEmailCode(
  email: string,
  code: string,
): Promise<ApiResponse<undefined, EmailVerificationCodeMismatchData>> {
  return apiRequest('/auth/email-verifications/verify', {
    method: 'POST',
    body: { email, code },
  });
}

function checkNickname(nickname: string): Promise<ApiResponse<{ available: boolean }>> {
  return apiRequest(`/auth/check-nickname?nickname=${encodeURIComponent(nickname)}`);
}

function uploadProfileImage(formData: FormData): Promise<ApiResponse<{ url: string }>> {
  return apiRequest('/upload/profile-image', {
    method: 'POST',
    body: formData,
  });
}

interface SocialRegisterPayload {
  nickname: string;
  bio: string;
  profileImageUrl: string;
  preferredGenres: Genre[];
}

function socialRegister(payload: SocialRegisterPayload): Promise<ApiResponse<{ token: string }>> {
  return apiRequest('/auth/social/register', {
    method: 'POST',
    credentials: 'include',
    body: payload,
  });
}

interface RegisterPayload {
  email: string;
  password: string;
  nickname: string;
  bio: string;
  profileImageUrl: string;
  preferredGenres: Genre[];
}

function generalRegister(payload: RegisterPayload): Promise<ApiResponse<{ token: string }>> {
  return apiRequest('/auth/register', {
    method: 'POST',
    credentials: 'include',
    body: payload,
  });
}

function login(email: string, password: string): Promise<ApiResponse<{ token: string }>> {
  return apiRequest('/auth/login', {
    method: 'POST',
    body: { email, password },
  });
}

function getMe(token: string | null): Promise<ApiResponse<User>> {
  return apiRequest('/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
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
