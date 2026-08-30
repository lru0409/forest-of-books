import {
  type ApiResponse,
  type Book,
  type LibraryEntryListItem,
  type LibraryEntryDetailItem,
  type LibraryEntryNotePatch,
  apiRequest,
} from '@/lib';

function getUserLibrary(
  userId: string,
  token?: string | null,
): Promise<ApiResponse<LibraryEntryListItem[]>> {
  return apiRequest(`/users/${userId}/library`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
}

function getLibraryEntry(
  entryId: string,
  token?: string | null,
): Promise<ApiResponse<LibraryEntryDetailItem>> {
  return apiRequest(`/library/${entryId}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });
}

function createEntry(
  book: Omit<Book, 'id'>,
  token: string,
): Promise<ApiResponse<LibraryEntryDetailItem>> {
  return apiRequest('/library', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: { book },
  });
}

function updateEntry(
  entryId: string,
  patch: LibraryEntryNotePatch,
  token: string,
): Promise<ApiResponse<LibraryEntryDetailItem>> {
  return apiRequest(`/library/${entryId}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
    body: patch,
  });
}

function deleteEntry(entryId: string, token: string): Promise<ApiResponse> {
  return apiRequest(`/library/${entryId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
}

export default {
  getUserLibrary,
  getLibraryEntry,
  createEntry,
  updateEntry,
  deleteEntry,
};
