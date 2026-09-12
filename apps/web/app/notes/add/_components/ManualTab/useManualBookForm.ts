'use client';

import { useMemo, useState } from 'react';

import type { InputState } from '@/components/ui/input';
import type { Book, Genre } from '@/lib';

type Feedback = { state: InputState; message?: string };
type TouchedField = 'title' | 'author' | 'genre' | 'color';

export function useManualBookForm(
  onAdd: (book: Omit<Book, 'id'>, color: string) => Promise<'success' | 'conflict' | 'error'>,
) {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [publisher, setPublisher] = useState('');
  const [genre, setGenre] = useState<Genre | null>(null);
  const [color, setColor] = useState<string | null>(null);
  const [touched, setTouched] = useState({
    title: false,
    author: false,
    genre: false,
    color: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const titleFeedback: Feedback = useMemo(() => {
    if (title.trim() === '') return { state: 'error', message: '제목을 입력해주세요.' };
    return { state: 'default' };
  }, [title]);

  const authorFeedback: Feedback = useMemo(() => {
    if (author.trim() === '') return { state: 'error', message: '저자를 입력해주세요.' };
    return { state: 'default' };
  }, [author]);

  const genreFeedback: Feedback = useMemo(() => {
    if (genre === null) return { state: 'error', message: '장르를 선택해주세요.' };
    return { state: 'default' };
  }, [genre]);

  const colorFeedback: Feedback = useMemo(() => {
    if (color === null) return { state: 'error', message: '색상을 선택해주세요.' };
    return { state: 'default' };
  }, [color]);

  const canSubmit =
    titleFeedback.state !== 'error' &&
    authorFeedback.state !== 'error' &&
    genreFeedback.state !== 'error' &&
    colorFeedback.state !== 'error';

  const setFieldTouched = (field: TouchedField) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || isSubmitting) return 'error' as const;

    setIsSubmitting(true);
    const result = await onAdd(
      {
        title: title.trim(),
        author: author.trim(),
        genre: genre as Genre,
        ...(publisher.trim() !== '' && { publisher: publisher.trim() }),
      },
      color as string,
    );
    setIsSubmitting(false);
    return result;
  };

  return {
    title: {
      value: title,
      onChange: setTitle,
      onBlur: () => setFieldTouched('title'),
      state: touched.title ? titleFeedback.state : 'default',
      message: touched.title ? titleFeedback.message : undefined,
    },
    author: {
      value: author,
      onChange: setAuthor,
      onBlur: () => setFieldTouched('author'),
      state: touched.author ? authorFeedback.state : 'default',
      message: touched.author ? authorFeedback.message : undefined,
    },
    publisher: {
      value: publisher,
      onChange: setPublisher,
    },
    genre: {
      value: genre,
      onChange: setGenre,
      onBlur: () => setFieldTouched('genre'),
      state: touched.genre ? genreFeedback.state : 'default',
      message: touched.genre ? genreFeedback.message : undefined,
    },
    color: {
      value: color,
      onChange: setColor,
      onBlur: () => setFieldTouched('color'),
      state: touched.color ? colorFeedback.state : 'default',
      message: touched.color ? colorFeedback.message : undefined,
    },
    isSubmitting,
    canSubmit,
    handleSubmit,
  };
}
