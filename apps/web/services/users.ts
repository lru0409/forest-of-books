import { type ApiResponse, type Genre, type PublicUserProfile, type Me, apiRequest } from '@/lib';

function getUserProfile(
  userId: string,
  token?: string | null,
): Promise<ApiResponse<PublicUserProfile>> {
  return apiRequest(`/users/${userId}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
}

function getMe(token: string | null): Promise<ApiResponse<Me>> {
  return apiRequest('/users/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
}

interface UpdateMyProfilePayload {
  nickname?: string;
  bio?: string;
  profileImage?: string;
  preferredGenres?: Genre[];
}

function updateMyProfile(
  payload: UpdateMyProfilePayload,
  token: string,
): Promise<ApiResponse<Me>> {
  return apiRequest('/users/me', {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
    body: payload,
  });
}

export default {
  getUserProfile,
  getMe,
  updateMyProfile,
};
