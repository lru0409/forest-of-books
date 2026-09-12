'use client';

import { Input, Button } from '@/components/ui';
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
import { useManualBookForm } from './useManualBookForm';

interface ManualTabProps {
  onAdd: (book: Omit<Book, 'id'>, color: string) => Promise<'success' | 'conflict' | 'error'>;
}

export function ManualTab({ onAdd }: ManualTabProps) {
  const { openDialog, closeDialog } = useDialog();
  const { title, author, publisher, genre, color, isSubmitting, canSubmit, handleSubmit } =
    useManualBookForm(onAdd);

  const onSubmit = async (e: React.FormEvent) => {
    const result = await handleSubmit(e);
    if (result !== 'success') {
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
    <form onSubmit={onSubmit} className="mt-2 flex flex-1 flex-col justify-between">
      <div className="flex flex-col gap-4">
        <div>
          <label htmlFor="title" className="mb-2 block text-lg font-semibold">
            제목
          </label>
          <Input
            id="title"
            value={title.value}
            onChange={(e) => title.onChange(e.target.value)}
            onBlur={title.onBlur}
            placeholder="제목을 입력하세요."
            state={title.state}
            message={title.message}
            disabled={isSubmitting}
          />
        </div>
        <div>
          <label htmlFor="author" className="mb-2 block text-lg font-semibold">
            저자
          </label>
          <Input
            id="author"
            value={author.value}
            onChange={(e) => author.onChange(e.target.value)}
            onBlur={author.onBlur}
            placeholder="저자를 입력하세요."
            state={author.state}
            message={author.message}
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
            value={publisher.value}
            onChange={(e) => publisher.onChange(e.target.value)}
            placeholder="출판사를 입력하세요."
            disabled={isSubmitting}
          />
        </div>
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="flex-1">
            <label htmlFor="genre" className="mb-2 block text-lg font-semibold">
              장르
            </label>
            <Select
              value={genre.value ?? undefined}
              onValueChange={(value) => genre.onChange(value as Genre)}
              onOpenChange={(open) => {
                if (!open) genre.onBlur();
              }}
              disabled={isSubmitting}
            >
              <SelectTrigger id="genre" aria-label="장르 선택" state={genre.state}>
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
            {genre.message && <p className="text-destructive mt-1.5 text-sm">{genre.message}</p>}
          </div>
          <div className="flex-1">
            <label htmlFor="color" className="mb-2 block text-lg font-semibold">
              색상
            </label>
            <BookColorPicker
              id="color"
              value={color.value}
              state={color.state}
              disabled={isSubmitting}
              onChange={color.onChange}
              onOpenChange={(open) => {
                if (!open) color.onBlur();
              }}
            />
            {color.message && <p className="text-destructive mt-1.5 text-sm">{color.message}</p>}
          </div>
        </div>
      </div>
      <Button type="submit" className="mt-5" disabled={!canSubmit} isLoading={isSubmitting}>
        등록하기
      </Button>
    </form>
  );
}
