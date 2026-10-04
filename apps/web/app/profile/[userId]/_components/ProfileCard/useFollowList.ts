'use client';

import { useCallback, useEffect, useReducer, useRef } from 'react';

import { type FollowUser } from '@/lib';
import { useAuthStore } from '@/store/authStore';
import FollowService from '@/services/follow';

const PAGE_SIZE = 20;

interface FollowListState {
  items: FollowUser[];
  nextCursor: string | null;
  isLoading: boolean;
  isLoadingMore: boolean;
  hasFetched: boolean;
  error: boolean;
}

const initialState: FollowListState = {
  items: [],
  nextCursor: null,
  isLoading: true,
  isLoadingMore: false,
  hasFetched: false,
  error: false,
};

type FollowListAction =
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS'; items: FollowUser[]; nextCursor: string | null }
  | { type: 'FETCH_ERROR' }
  | { type: 'LOAD_MORE_START' }
  | { type: 'LOAD_MORE_SUCCESS'; items: FollowUser[]; nextCursor: string | null }
  | { type: 'LOAD_MORE_ERROR' }
  | { type: 'PATCH_ITEM'; userId: string; isFollowing: boolean };

function followListReducer(state: FollowListState, action: FollowListAction): FollowListState {
  switch (action.type) {
    case 'FETCH_START':
      return { ...initialState };
    case 'FETCH_SUCCESS':
      return {
        ...state,
        items: action.items,
        nextCursor: action.nextCursor,
        isLoading: false,
        hasFetched: true,
        error: false,
      };
    case 'FETCH_ERROR':
      return { ...state, isLoading: false, hasFetched: true, error: true };
    case 'LOAD_MORE_START':
      return { ...state, isLoadingMore: true };
    case 'LOAD_MORE_SUCCESS':
      return {
        ...state,
        items: [...state.items, ...action.items],
        nextCursor: action.nextCursor,
        isLoadingMore: false,
      };
    case 'LOAD_MORE_ERROR':
      return { ...state, isLoadingMore: false };
    case 'PATCH_ITEM':
      return {
        ...state,
        items: state.items.map((item) =>
          item.id === action.userId ? { ...item, isFollowing: action.isFollowing } : item,
        ),
      };
    default:
      return state;
  }
}

type FollowListViewState ='loading' | 'error' | 'empty' | 'results';

export function useFollowList(userId: string, mode: 'followers' | 'following') {
  const token = useAuthStore((state) => state.token);
  const [state, dispatch] = useReducer(followListReducer, initialState);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const requestIdRef = useRef(0);

  const { items, nextCursor, isLoading, isLoadingMore, hasFetched, error } = state;
  const hasMore = hasFetched && nextCursor !== null;
  const fetchPage = mode === 'followers' ? FollowService.getFollowers : FollowService.getFollowing;

  useEffect(() => {
    requestIdRef.current += 1;
    const requestId = requestIdRef.current;

    const fetchFirstPage = async () => {
      dispatch({ type: 'FETCH_START' });
      const response = await fetchPage(userId, { limit: PAGE_SIZE }, token);
      if (requestIdRef.current !== requestId) return;
      if (!response.isSuccess) {
        dispatch({ type: 'FETCH_ERROR' });
      } else {
        dispatch({
          type: 'FETCH_SUCCESS',
          items: response.data.items,
          nextCursor: response.data.nextCursor,
        });
      }
    };

    fetchFirstPage();
  }, [userId, mode, token, fetchPage]);

  const loadMore = useCallback(async () => {
    if (isLoading || isLoadingMore || !hasMore) return;

    const requestId = requestIdRef.current;
    dispatch({ type: 'LOAD_MORE_START' });

    const response = await fetchPage(
      userId,
      { cursor: nextCursor ?? undefined, limit: PAGE_SIZE },
      token,
    );
    if (requestIdRef.current !== requestId) return;
    if (response.isSuccess) {
      dispatch({
        type: 'LOAD_MORE_SUCCESS',
        items: response.data.items,
        nextCursor: response.data.nextCursor,
      });
    } else {
      dispatch({ type: 'LOAD_MORE_ERROR' });
    }
  }, [fetchPage, hasMore, isLoading, isLoadingMore, nextCursor, token, userId]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) loadMore();
    });
    observer.observe(sentinel);

    return () => observer.disconnect();
  }, [hasMore, loadMore]);

  const patchItem = useCallback((patchedUserId: string, isFollowing: boolean) => {
    dispatch({ type: 'PATCH_ITEM', userId: patchedUserId, isFollowing });
  }, []);

  const viewState: FollowListViewState = (() => {
    if (isLoading) return 'loading';
    if (error) return 'error';
    if (items.length === 0) return 'empty';
    return 'results';
  })();

  return { items, viewState, isLoadingMore, hasMore, sentinelRef, patchItem };
}
