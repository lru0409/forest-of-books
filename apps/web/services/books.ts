import { type ApiResponse, type Book, apiRequest } from '@/lib';

interface SearchBooksData {
  total: number;
  items: Book[];
}

function searchBooks(query: string, page = 1, limit = 10): Promise<ApiResponse<SearchBooksData>> {
  const params = new URLSearchParams({
    query,
    page: String(page),
    limit: String(limit),
  });
  return apiRequest<SearchBooksData>(`/books/search?${params.toString()}`);
}

export default {
  searchBooks,
};
