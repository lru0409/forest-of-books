'use client';

import { useRouter } from 'next/navigation';
import { BookOpen, UserRoundKey, TriangleAlert, LoaderCircle } from 'lucide-react';

import { useLocalStorage, type LibraryEntryListItem } from '@/lib';
import { Container } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { StatusNotice } from '@/components/common';
import { useAuthStore } from '@/store/authStore';
import { type ViewMode } from './types';
import { BookShelf, BookCardGrid, FilterBar, BookDetailAside } from './_components';
import { useLibrary, useLibraryFilters, useSelectedLibraryItem } from './_hooks';

export default function NotesPage() {
  const router = useRouter();

  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);

  const [viewMode, setViewMode] = useLocalStorage<ViewMode>('notes-view-mode', 'shelf');

  const { items, isLoading, isError, updateItem, deleteItem } = useLibrary({
    userId: user?.id,
    token,
  });
  const {
    searchQuery,
    setSearchQuery,
    selectedGenres,
    setSelectedGenres,
    selectedStatuses,
    setSelectedStatuses,
    filteredItems,
  } = useLibraryFilters(items);
  const { selectedItem, isClosing, isEntering } = useSelectedLibraryItem(items);

  if (!token) {
    return (
      <Container>
        <StatusNotice
          className="h-full"
          icon={
            <UserRoundKey className="text-primary size-18" strokeWidth={1.6} aria-hidden="true" />
          }
          title="로그인이 필요해요"
          description="로그인하고 나만의 서재를 확인해보세요."
          action={
            <Button className="mt-6 w-full" onClick={() => router.push('/signin')}>
              로그인하러 가기
            </Button>
          }
        />
      </Container>
    );
  }

  if (isError) {
    return (
      <Container>
        <StatusNotice
          className="h-full"
          icon={
            <TriangleAlert className="text-primary size-14" strokeWidth={1.6} aria-hidden="true" />
          }
          title="서재를 불러오지 못했어요"
          description="잠시 후 다시 시도해주세요."
        />
      </Container>
    );
  }

  if (!user || isLoading) {
    return (
      <Container>
        <StatusNotice
          className="h-full"
          icon={
            <LoaderCircle
              className="text-primary size-12 animate-spin"
              strokeWidth={2}
              aria-hidden="true"
            />
          }
          title="서재를 불러오는 중이에요"
          description="잠시만 기다려주세요."
        />
      </Container>
    );
  }

  if (items.length === 0) {
    return (
      <Container>
        <StatusNotice
          className="h-full"
          icon={<BookOpen className="text-primary size-18" strokeWidth={1.2} aria-hidden="true" />}
          title={'책장이 비어있어요'}
          description={'책을 추가해 나만의 서재를 채워보세요.'}
          action={
            <Button className="mt-6 w-full" onClick={() => router.push('/notes/add')}>
              책 추가하기
            </Button>
          }
        />
      </Container>
    );
  }

  return (
    <Container
      aside={
        selectedItem && (
          <BookDetailAside
            item={selectedItem}
            updateItem={(patch) => updateItem(selectedItem.id, patch)}
            deleteItem={() => deleteItem(selectedItem.id)}
            isClosing={isClosing}
            isEntering={isEntering}
          />
        )
      }
    >
      <div className="flex h-full flex-col md:min-w-[400px]">
        <FilterBar
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          selectedGenres={selectedGenres}
          onSelectedGenresChange={setSelectedGenres}
          selectedStatuses={selectedStatuses}
          onSelectedStatusesChange={setSelectedStatuses}
          view={viewMode}
          onViewChange={setViewMode}
        />
        <div className="mt-6 flex flex-1 flex-col md:mt-8">
          <BooksView mode={viewMode} filteredItems={filteredItems} />
        </div>
      </div>
    </Container>
  );
}

const BooksView = ({
  mode,
  filteredItems,
}: {
  mode: ViewMode;
  filteredItems: LibraryEntryListItem[];
}) => {
  if (filteredItems.length === 0) {
    return (
      <StatusNotice
        className="flex-1"
        icon={<BookOpen className="text-primary size-18" strokeWidth={1.2} aria-hidden="true" />}
        title={'조건에 맞는 책이 없어요'}
        description={'검색어나 필터 조건을 바꿔보세요.'}
      />
    );
  }

  if (mode === 'shelf') {
    return <BookShelf items={filteredItems} />;
  }
  return <BookCardGrid items={filteredItems} />;
};
