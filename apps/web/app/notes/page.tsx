'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { BookOpen, UserRoundKey, TriangleAlert, LoaderCircle } from 'lucide-react';

import {
  GENRES,
  READING_STATUSES,
  useDebounce,
  useLocalStorage,
  type Genre,
  type ReadingStatus,
  type LibraryEntryListItem,
  type LibraryEntryNotePatch,
} from '@/lib';
import { Container } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { StatusNotice } from '@/components/common';
import { useAuthStore } from '@/store/authStore';
import LibraryService from '@/services/library';
import { type ViewMode } from './types';
import {
  BookShelf,
  BookCardGrid,
  FilterBar,
  BookDetailAside,
  PANEL_TRANSITION_MS,
} from './_components';

// TODO: 로직을 훅으로 분리

// TODO: 유틸 함수로 재사용?
function parseFilterParam<T extends string>(value: string | null, validValues: readonly T[]): T[] {
  if (!value) return [...validValues];
  const values = value.split(',').filter((item): item is T => validValues.includes(item as T));
  return values.length > 0 ? values : [...validValues];
}

export default function NotesPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchParamsString = searchParams.toString();
  const selectedItemId = searchParams.get('item');

  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);

  const [viewMode, setViewMode] = useLocalStorage<ViewMode>('notes-view-mode', 'shelf');
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get('q') ?? '');
  const [selectedGenres, setSelectedGenres] = useState<Genre[]>(() =>
    parseFilterParam(searchParams.get('genres'), GENRES),
  );
  const [selectedStatuses, setSelectedStatuses] = useState<ReadingStatus[]>(() =>
    parseFilterParam(searchParams.get('statuses'), READING_STATUSES),
  );

  const [items, setItems] = useState<LibraryEntryListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);

  const [selectedItem, setSelectedItem] = useState<LibraryEntryListItem | undefined>(undefined);
  const [isClosing, setIsClosing] = useState(false);
  const [isEntering, setIsEntering] = useState(false);
  const wasOpenRef = useRef(false);

  useEffect(() => {
    if (!user || !token) return;

    setIsLoading(true);
    setError(false);
    LibraryService.getUserLibrary(user.id, token).then((result) => {
      if (result.isSuccess) {
        setItems(result.data);
      } else {
        setError(true);
      }
      setIsLoading(false);
    });
  }, [user, token]);

  const debouncedSearchQuery = useDebounce(searchQuery);

  useEffect(() => {
    const params = new URLSearchParams(searchParamsString);

    if (debouncedSearchQuery) {
      params.set('q', debouncedSearchQuery);
    } else {
      params.delete('q');
    }

    if (selectedGenres.length < GENRES.length) {
      params.set('genres', selectedGenres.join(','));
    } else {
      params.delete('genres');
    }

    if (selectedStatuses.length < READING_STATUSES.length) {
      params.set('statuses', selectedStatuses.join(','));
    } else {
      params.delete('statuses');
    }

    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [
    debouncedSearchQuery,
    selectedGenres,
    selectedStatuses,
    pathname,
    router,
    searchParamsString,
  ]);

  const filteredItems = useMemo(() => {
    const query = debouncedSearchQuery.trim().toLowerCase();
    return items.filter(({ title, author, genre, status }) => {
      const matchesQuery =
        query === '' || title.toLowerCase().includes(query) || author.toLowerCase().includes(query);
      const matchesGenre = selectedGenres.includes(genre);
      const matchesStatus = selectedStatuses.includes(status);
      return matchesQuery && matchesGenre && matchesStatus;
    });
  }, [items, debouncedSearchQuery, selectedGenres, selectedStatuses]);

  useEffect(() => {
    const selectedItem = selectedItemId ? items.find((item) => item.id === selectedItemId) : null;
    if (selectedItem) {
      const isNewlyOpening = !wasOpenRef.current;
      setSelectedItem(selectedItem);
      setIsClosing(false);
      wasOpenRef.current = true;

      if (isNewlyOpening) {
        setIsEntering(true);
        const timer = setTimeout(() => setIsEntering(false), 20);
        return () => clearTimeout(timer);
      }
    } else if (wasOpenRef.current) {
      wasOpenRef.current = false;
      setIsClosing(true);
      const timer = setTimeout(() => setSelectedItem(undefined), PANEL_TRANSITION_MS);
      return () => clearTimeout(timer);
    }
  }, [selectedItemId, items]);

  const handleUpdateItem = (itemId: string, patch: LibraryEntryNotePatch) => {
    // TODO: PATCH /library/:entryId 연동
    setItems((current) =>
      current.map((item) => (item.id === itemId ? { ...item, ...patch } : item)),
    );
  };

  const handleDeleteItem = (itemId: string) => {
    // TODO: DELETE /library/:entryId 연동
    setItems((current) => current.filter((item) => item.id !== itemId));
    router.push(pathname, { scroll: false });
  };

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

  if (error) {
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
            updateItem={(patch) => handleUpdateItem(selectedItem.id, patch)}
            deleteItem={() => handleDeleteItem(selectedItem.id)}
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
