'use client';

import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { SearchX, LoaderCircle, Search, CircleX } from 'lucide-react';

import { BookCover, SearchInput, StatusNotice } from '@/components/common';
import { Button } from '@/components/ui';
import { Modal } from '@/components/layout';
import { useDialog } from '@/context/dialog';
import { useDebounce, cn, type Book } from '@/lib';
import booksService from '@/services/books';

interface SearchTabProps {
  onAdd: (book: Book) => Promise<boolean>;
  onGoToManual: () => void;
}

// TODO: 이미 등록된 책 클릭 시 처리
// TODO: 로직을 훅으로 분리

interface SearchState {
  results: Book[];
  total: number;
  page: number;
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
}

const initialSearchState: SearchState = {
  results: [],
  total: 0,
  page: 1,
  isLoading: false,
  isLoadingMore: false,
  error: null,
};

type SearchAction =
  | { type: 'RESET' }
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS'; results: Book[]; total: number }
  | { type: 'FETCH_ERROR' }
  | { type: 'LOAD_MORE_START' }
  | { type: 'LOAD_MORE_SUCCESS'; results: Book[] }
  | { type: 'LOAD_MORE_ERROR' };

function searchReducer(state: SearchState, action: SearchAction): SearchState {
  switch (action.type) {
    case 'RESET':
      return initialSearchState;
    case 'FETCH_START':
      return { ...initialSearchState, isLoading: true };
    case 'FETCH_SUCCESS':
      return {
        ...state,
        results: action.results,
        total: action.total,
        page: 1,
        isLoading: false,
        error: null,
      };
    case 'FETCH_ERROR':
      return {
        ...state,
        isLoading: false,
        error: '검색에 실패했어요. 잠시 후 다시 시도해주세요.',
      };
    case 'LOAD_MORE_START':
      return { ...state, isLoadingMore: true };
    case 'LOAD_MORE_SUCCESS':
      return {
        ...state,
        results: [...state.results, ...action.results],
        page: state.page + 1,
        isLoadingMore: false,
      };
    case 'LOAD_MORE_ERROR':
      return { ...state, isLoadingMore: false };
    default:
      return state;
  }
}

export function SearchTab({ onAdd, onGoToManual }: SearchTabProps) {
  const { openDialog, closeDialog } = useDialog();

  const [query, setQuery] = useState('');
  const [state, dispatch] = useReducer(searchReducer, initialSearchState);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const requestIdRef = useRef(0);
  const [addingId, setAddingId] = useState<string | null>(null);

  const debouncedQuery = useDebounce(query);
  const isSearching = debouncedQuery.trim() !== '';
  const { results, total, page, isLoading, isLoadingMore, error } = state;
  const hasMore = results.length < total;

  useEffect(() => {
    requestIdRef.current += 1;
    const requestId = requestIdRef.current;

    if (!isSearching) {
      dispatch({ type: 'RESET' });
      return;
    }

    const fetchResults = async () => {
      dispatch({ type: 'FETCH_START' });
      const response = await booksService.searchBooks(debouncedQuery.trim());
      if (requestIdRef.current !== requestId) return;
      if (!response.isSuccess) {
        dispatch({ type: 'FETCH_ERROR' });
      } else {
        dispatch({
          type: 'FETCH_SUCCESS',
          results: response.data.items,
          total: response.data.total,
        });
      }
    };

    fetchResults();
  }, [debouncedQuery, isSearching]);

  const loadMore = useCallback(async () => {
    if (isLoading || isLoadingMore || !hasMore) return;

    const requestId = requestIdRef.current;
    const nextPage = page + 1;
    dispatch({ type: 'LOAD_MORE_START' });

    const response = await booksService.searchBooks(debouncedQuery.trim(), nextPage);
    if (requestIdRef.current !== requestId) return;
    if (response.isSuccess) {
      dispatch({ type: 'LOAD_MORE_SUCCESS', results: response.data.items });
    } else {
      dispatch({ type: 'LOAD_MORE_ERROR' });
    }
  }, [debouncedQuery, hasMore, isLoading, isLoadingMore, page]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) loadMore();
    });
    observer.observe(sentinel);

    return () => observer.disconnect();
  }, [hasMore, loadMore]);

  const handleAddClick = async (book: Book) => {
    if (addingId) return;

    setAddingId(book.id);
    const success = await onAdd(book);
    if (!success) {
      setAddingId(null);
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

  const viewState = (() => {
    if (!isSearching) return 'idle';
    if (isLoading) return 'loading';
    if (error) return 'error';
    if (results.length === 0) return 'empty';
    return 'results';
  })();

  return (
    <div className="flex flex-1 flex-col gap-4">
      <SearchInput
        autoFocus
        value={query}
        onChange={setQuery}
        placeholder="제목 또는 저자로 검색하세요."
      />
      <div className="flex flex-1 flex-col">
        {viewState === 'idle' && (
          <StatusNotice
            className="flex-1"
            icon={<Search className="text-primary size-10" strokeWidth={2.5} aria-hidden="true" />}
            title="등록하고 싶은 책을 검색하세요."
          />
        )}
        {viewState === 'loading' && (
          <StatusNotice
            className="flex-1"
            icon={
              <LoaderCircle
                className="text-primary size-9 animate-spin"
                strokeWidth={2.5}
                aria-hidden="true"
              />
            }
            title="불러오는 중..."
          />
        )}
        {viewState === 'empty' && (
          <StatusNotice
            className="flex-1"
            icon={<CircleX className="text-primary size-12" strokeWidth={1.6} aria-hidden="true" />}
            title="검색 결과가 없어요."
            description="직접 입력해서 등록해주세요"
            action={
              <Button size="sm" className="mt-2" onClick={onGoToManual}>
                직접 입력하기
              </Button>
            }
          />
        )}
        {viewState === 'error' && (
          <StatusNotice
            className="flex-1"
            icon={<SearchX className="text-primary size-12" strokeWidth={2} aria-hidden="true" />}
            title={error ?? '오류가 발생했어요.'}
          />
        )}
        {viewState === 'results' && (
          <div className="flex flex-col gap-1">
            {results.map((book, index) => {
              const isAdding = addingId === book.id;
              return (
                <button
                  key={book.id}
                  type="button"
                  onClick={() => handleAddClick(book)}
                  disabled={addingId !== null}
                  aria-busy={isAdding}
                  className={cn(
                    'flex w-full items-center gap-4 rounded-lg p-2 text-left transition-colors',
                    addingId !== null
                      ? 'cursor-not-allowed opacity-60'
                      : 'hover:bg-primary/8 cursor-pointer',
                  )}
                >
                  <div className="relative">
                    <BookCover book={book} index={index} />
                    {isAdding && (
                      <div className="absolute inset-0 flex items-center justify-center rounded-sm bg-white/60">
                        <LoaderCircle
                          className="text-primary size-5 animate-spin"
                          strokeWidth={3}
                        />
                      </div>
                    )}
                  </div>
                  <div className="flex flex-1 flex-col gap-1">
                    <span className="line-clamp-2 text-base font-semibold">{book.title}</span>
                    <span className="text-secondary line-clamp-1 text-sm">
                      {book.author}
                      {book.publisher ? ` | ${book.publisher}` : ''}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
        {hasMore && (
          <div ref={sentinelRef} className="flex items-center justify-center gap-1.5 py-6">
            {isLoadingMore && (
              <>
                <LoaderCircle className="text-secondary size-5 animate-spin" strokeWidth={4} />
                <p className="text-secondary text-sm">불러오는 중...</p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
