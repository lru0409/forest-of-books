import { type ApiResponse, type Book, API_URL, withApiErrorHandling } from '@/lib';

interface SearchBooksData {
  total: number;
  items: Book[];
}

async function searchBooks(
  query: string,
  page = 1,
  limit = 10,
): Promise<ApiResponse<SearchBooksData>> {
  const params = new URLSearchParams({
    query,
    page: String(page),
    limit: String(limit),
  });
  const res = await fetch(`${API_URL}/books/search?${params.toString()}`);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { isSuccess: false, statusCode: res.status, errorCode: body.errorCode };
  }
  return { isSuccess: true, statusCode: res.status, data: body };
}

export default {
  searchBooks: withApiErrorHandling(searchBooks),
};
