import { type ApiResponse, type LibraryEntryListItem, apiRequest } from '@/lib';

function getUserLibrary(
  userId: string,
  token: string,
): Promise<ApiResponse<LibraryEntryListItem[]>> {
  return apiRequest(`/users/${userId}/library`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

export default {
  getUserLibrary,
};
