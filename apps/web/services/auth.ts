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

export default {
  socialRegister,
  generalRegister,
};
