export type Genre =
  | 'NOVEL'
  | 'POETRY'
  | 'ESSAY'
  | 'HUMANITIES'
  | 'SOCIAL_POLITICS'
  | 'ECONOMICS_BUSINESS'
  | 'SELF_DEVELOPMENT'
  | 'SCIENCE_TECHNOLOGY'
  | 'HISTORY'
  | 'ART_CULTURE'
  | 'TRAVEL'
  | 'CHILDREN_TEEN'
  | 'COMICS'
  | 'OTHER';

export type ReadingStatus = 'NOT_STARTED' | 'READING' | 'COMPLETED' | 'ON_HOLD';

export type Book = {
  id: string;
  title: string;
  author: string;
  genre: Genre;
  publisher?: string;
};

export type ReadingNote = {
  status: ReadingStatus;
  color: string;
  rating?: number;
  comment?: string;
  note?: string;
  createdAt?: string;
  updatedAt?: string;
};
