export const FEED_TABS = ['recommended', 'popular', 'following', 'latest'] as const;

export type FeedTab = (typeof FEED_TABS)[number];

// 인기 노트/책을 집계하는 기간
export const POPULAR_WINDOW_MS = 30 * 24 * 60 * 60 * 1000; // 30일
