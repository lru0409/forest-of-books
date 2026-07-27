import { type Book, type ReadingNote } from '@/lib';

export type ViewMode = 'shelf' | 'card';
export type BookWithNote = Book & ReadingNote;
