'use client';

import { useMemo, useState } from 'react';

import { Input, Button } from '@/components/ui';
import type { InputState } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { GENRES, GENRE_LABELS, type Book, type Genre } from '@/lib';

interface ManualTabProps {
  onAdd: (book: Omit<Book, 'id'>) => void;
}

export function ManualTab({ onAdd }: ManualTabProps) {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [publisher, setPublisher] = useState('');
  const [genre, setGenre] = useState<Genre | ''>('');
  const [touched, setTouched] = useState({ title: false, author: false, genre: false });

  const titleFeedback: { state: InputState; message?: string } = useMemo(() => {
    if (title.trim() === '') return { state: 'error', message: '제목을 입력해주세요.' };
    return { state: 'default' };
  }, [title]);

  const authorFeedback: { state: InputState; message?: string } = useMemo(() => {
    if (author.trim() === '') return { state: 'error', message: '저자를 입력해주세요.' };
    return { state: 'default' };
  }, [author]);

  const genreFeedback: { state: InputState; message?: string } = useMemo(() => {
    if (genre === '') return { state: 'error', message: '장르를 선택해주세요.' };
    return { state: 'default' };
  }, [genre]);

  const canSubmit =
    titleFeedback.state !== 'error' &&
    authorFeedback.state !== 'error' &&
    genreFeedback.state !== 'error';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    onAdd({
      title: title.trim(),
      author: author.trim(),
      genre: genre as Genre,
      ...(publisher.trim() !== '' && { publisher: publisher.trim() }),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="mt-2 flex flex-1 flex-col justify-between">
      <div className="flex flex-col gap-4">
        <div>
          <label htmlFor="title" className="mb-2 block text-lg font-semibold">
            제목
          </label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => setTouched((prev) => ({ ...prev, title: true }))}
            placeholder="제목을 입력하세요."
            state={touched.title ? titleFeedback.state : 'default'}
            message={touched.title ? titleFeedback.message : undefined}
          />
        </div>
        <div>
          <label htmlFor="author" className="mb-2 block text-lg font-semibold">
            저자
          </label>
          <Input
            id="author"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            onBlur={() => setTouched((prev) => ({ ...prev, author: true }))}
            placeholder="저자를 입력하세요."
            state={touched.author ? authorFeedback.state : 'default'}
            message={touched.author ? authorFeedback.message : undefined}
          />
        </div>
        <div>
          <label htmlFor="publisher" className="mb-1 block text-lg font-semibold">
            출판사
          </label>
          <p className="text-secondary mb-2 text-sm">선택적으로 입력해주세요.</p>
          <Input
            id="publisher"
            value={publisher}
            onChange={(e) => setPublisher(e.target.value)}
            placeholder="출판사를 입력하세요."
          />
        </div>
        <div>
          <label htmlFor="genre" className="mb-2 block text-lg font-semibold">
            장르
          </label>
          <Select
            value={genre}
            onValueChange={(value) => setGenre(value as Genre)}
            onOpenChange={(open) => {
              if (!open) setTouched((prev) => ({ ...prev, genre: true }));
            }}
          >
            <SelectTrigger
              id="genre"
              aria-label="장르 선택"
              state={touched.genre ? genreFeedback.state : 'default'}
            >
              <SelectValue placeholder="장르를 선택해주세요." />
            </SelectTrigger>
            <SelectContent>
              {GENRES.map((value) => (
                <SelectItem key={value} value={value}>
                  {GENRE_LABELS[value]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {touched.genre && genreFeedback.message && (
            <p className="text-destructive mt-1.5 text-sm">{genreFeedback.message}</p>
          )}
        </div>
      </div>
      <Button type="submit" className="mt-5" disabled={!canSubmit}>
        등록하기
      </Button>
    </form>
  );
}
