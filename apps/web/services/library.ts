import {
  type ApiResponse,
  type Book,
  type LibraryEntryListItem,
  type LibraryEntryDetailItem,
  apiRequest,
} from '@/lib';

function getUserLibrary(
  userId: string,
  token: string,
): Promise<ApiResponse<LibraryEntryListItem[]>> {
  return apiRequest(`/users/${userId}/library`, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

function getLibraryEntry(
  entryId: string,
  token: string,
): Promise<ApiResponse<LibraryEntryDetailItem>> {
  return apiRequest(`/library/${entryId}`, {
    headers: { Authorization: `Bearer ${token}` },
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

export default {
  getUserLibrary,
  getLibraryEntry,
  createEntry,
};
