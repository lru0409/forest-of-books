export interface AladinBookItem {
  itemId: number;
  title: string;
  author: string;
  pubDate: string;
  description: string;
  publisher: string;
  isbn13: string;
  cover: string;
  categoryName: string;
  bestRank: number;
}

export interface AladinSearchResponse {
  totalResults: number;
  item?: AladinBookItem[];
  errorCode?: number;
  errorMessage?: string;
}
