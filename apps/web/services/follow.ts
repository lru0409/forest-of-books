import { type ApiResponse, type FollowList, apiRequest } from '@/lib';

interface FollowListOptions {
  cursor?: string;
  limit?: number;
}

function followUser(userId: string, token: string): Promise<ApiResponse> {
  return apiRequest(`/users/${userId}/follow`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
}

function unfollowUser(userId: string, token: string): Promise<ApiResponse> {
  return apiRequest(`/users/${userId}/follow`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
}

function getFollowers(
  userId: string,
  { cursor, limit }: FollowListOptions = {},
  token?: string | null,
): Promise<ApiResponse<FollowList>> {
  const params = new URLSearchParams();
  if (cursor) params.set('cursor', cursor);
  if (limit) params.set('limit', String(limit));
  return apiRequest(`/users/${userId}/followers?${params.toString()}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
}

function getFollowing(
  userId: string,
  { cursor, limit }: FollowListOptions = {},
  token?: string | null,
): Promise<ApiResponse<FollowList>> {
  const params = new URLSearchParams();
  if (cursor) params.set('cursor', cursor);
  if (limit) params.set('limit', String(limit));
  return apiRequest(`/users/${userId}/following?${params.toString()}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
}

export default { followUser, unfollowUser, getFollowers, getFollowing };
