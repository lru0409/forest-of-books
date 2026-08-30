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

export type Book = {
  id: string;
  title: string;
  author: string;
  genre: Genre;
  publisher?: string;
  coverUrl?: string;
  isbn?: string;
};
