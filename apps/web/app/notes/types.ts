export type ReadingStatus = 'not_started' | 'reading' | 'completed' | 'on_hold';

export interface Book {
  id: string;
  title: string;
  author: string;
  genre: string;
  status: ReadingStatus;
  color: string;
}
