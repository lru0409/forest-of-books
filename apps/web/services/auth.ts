const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

interface SocialRegisterPayload {
  nickname: string;
  bio: string;
  profileImageUrl?: string;
  genres: string[];
}

async function socialRegister(payload: SocialRegisterPayload): Promise<{ token: string }> {
  const res = await fetch(`${API_URL}/auth/social/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Social register failed');
  return res.json() as Promise<{ token: string }>;
}

export default {
  socialRegister,
};
