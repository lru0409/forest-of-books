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
import { Modal } from '@/components/layout';
import { BookColorPicker } from '@/components/common';
import { useDialog } from '@/context/dialog';
import { GENRES, GENRE_LABELS, type Book, type Genre } from '@/lib';

// TODO: 로직을 훅으로 분리

interface ManualTabProps {
  onAdd: (book: Omit<Book, 'id'>, color: string) => Promise<boolean>;
}

export function ManualTab({ onAdd }: ManualTabProps) {
  const { openDialog, closeDialog } = useDialog();

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

  const titleFeedback: { state: InputState; message?: string } = useMemo(() => {
    if (title.trim() === '') return { state: 'error', message: '제목을 입력해주세요.' };
    return { state: 'default' };
  }, [title]);

  const authorFeedback: { state: InputState; message?: string } = useMemo(() => {
    if (author.trim() === '') return { state: 'error', message: '저자를 입력해주세요.' };
    return { state: 'default' };
  }, [author]);

  const genreFeedback: { state: InputState; message?: string } = useMemo(() => {
    if (genre === null) return { state: 'error', message: '장르를 선택해주세요.' };
    return { state: 'default' };
  }, [genre]);

  const colorFeedback: { state: InputState; message?: string } = useMemo(() => {
    if (color === null) return { state: 'error', message: '색상을 선택해주세요.' };
    return { state: 'default' };
  }, [color]);

  const canSubmit =
    titleFeedback.state !== 'error' &&
    authorFeedback.state !== 'error' &&
    genreFeedback.state !== 'error' &&
    colorFeedback.state !== 'error';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || isSubmitting) return;

    setIsSubmitting(true);
    const success = await onAdd(
      {
        title: title.trim(),
        author: author.trim(),
        genre: genre as Genre,
        ...(publisher.trim() !== '' && { publisher: publisher.trim() }),
      },
      color as string,
    );
    if (!success) {
      setIsSubmitting(false);
      openDialog(
        <Modal
          title={'등록에 실패했어요.\n잠시 후 다시 시도해주세요.'}
          buttons={[
            <Button key="close" onClick={closeDialog}>
              확인
            </Button>,
          ]}
          showCloseButton={false}
        />,
      );
    }
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
            disabled={isSubmitting}
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
            disabled={isSubmitting}
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
            disabled={isSubmitting}
          />
        </div>
        {/* TODO: 장르, 색상 항목 tab focus 시 border 두껍게 처리 */}
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="flex-1">
            <label htmlFor="genre" className="mb-2 block text-lg font-semibold">
              장르
            </label>
            <Select
              value={genre ?? undefined}
              onValueChange={(value) => setGenre(value as Genre)}
              onOpenChange={(open) => {
                if (!open) setTouched((prev) => ({ ...prev, genre: true }));
              }}
              disabled={isSubmitting}
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
          <div className="flex-1">
            <label htmlFor="color" className="mb-2 block text-lg font-semibold">
              색상
            </label>
            <BookColorPicker
              id="color"
              value={color}
              state={touched.color ? colorFeedback.state : 'default'}
              disabled={isSubmitting}
              onChange={setColor}
              onOpenChange={(open) => {
                if (!open) setTouched((prev) => ({ ...prev, color: true }));
              }}
            />
            {touched.color && colorFeedback.message && (
              <p className="text-destructive mt-1.5 text-sm">{colorFeedback.message}</p>
            )}
          </div>
        </div>
      </div>
      <Button type="submit" className="mt-5" disabled={!canSubmit} isLoading={isSubmitting}>
        등록하기
      </Button>
    </form>
  );
}
