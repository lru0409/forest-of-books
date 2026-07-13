import type { Genre } from './types/genre';

export const GENRE_LABELS: Record<Genre, string> = {
  NOVEL: '소설',
  POETRY: '시',
  ESSAY: '에세이',
  HUMANITIES: '인문',
  SOCIAL_POLITICS: '사회·정치',
  ECONOMICS_BUSINESS: '경제·경영',
  SELF_DEVELOPMENT: '자기계발',
  SCIENCE_TECHNOLOGY: '과학·기술',
  HISTORY: '역사',
  ART_CULTURE: '예술·문화',
  TRAVEL: '여행',
  CHILDREN_TEEN: '아동·청소년',
  COMICS: '만화',
};

export const GENRES = Object.keys(GENRE_LABELS) as Genre[];

export const BOOK_COLORS: string[] = [
  '#A27873',
  '#B78C6D',
  '#A0967D',
  '#81766A',
  '#717B72',
  '#93A07B',
  '#719677',
  '#648789',
  '#667D8C',
  '#6180A1',
  '#7C7392',
  '#A77F8E',
];
