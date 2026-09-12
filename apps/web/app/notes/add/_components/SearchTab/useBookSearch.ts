'use client';

import { useCallback, useEffect, useReducer, useRef, useState } from 'react';

import { useDebounce, type Book } from '@/lib';
import booksService from '@/services/books';

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

export type SearchViewState = 'idle' | 'loading' | 'error' | 'empty' | 'results';

export function useBookSearch() {
  const [query, setQuery] = useState('');
  const [state, dispatch] = useReducer(searchReducer, initialSearchState);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const requestIdRef = useRef(0);

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

  const viewState: SearchViewState = (() => {
    if (!isSearching) return 'idle';
    if (isLoading) return 'loading';
    if (error) return 'error';
    if (results.length === 0) return 'empty';
    return 'results';
  })();

  return {
    query,
    setQuery,
    results,
    error,
    isLoadingMore,
    hasMore,
    viewState,
    sentinelRef,
  };
}
