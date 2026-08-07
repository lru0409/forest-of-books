'use client';

import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';

import { Container } from '@/components/layout';
import { type Book } from '@/lib';
import { MOCK_BOOKS } from '../mockBooks';
import { SearchTab } from './_components';

const books = MOCK_BOOKS;

export default function AddBookPage() {
  const router = useRouter();

  const handleAdd = (book: Book) => {
    console.log('TODO [Add Book]', book);
    router.push('/notes');
  };

  return (
    <Container className="flex justify-center pb-8 md:pb-0">
      <div className="relative mt-16 flex w-125 min-w-80 flex-col pb-10">
        <button
          type="button"
          onClick={() => router.back()}
          className="text-secondary hover:text-primary absolute -top-9.5 left-0 flex cursor-pointer items-center gap-0.5 text-sm font-medium transition-colors"
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
          돌아가기
        </button>
        <h1 className="mb-2 text-3xl font-bold">책 등록하기</h1>
        <p className="text-secondary mb-3 text-base">검색해서 책을 등록해주세요.</p>
        <div className="flex flex-1 flex-col">
          <SearchTab existingBooks={books} onAdd={handleAdd} />
        </div>
      </div>
    </Container>
  );
}
