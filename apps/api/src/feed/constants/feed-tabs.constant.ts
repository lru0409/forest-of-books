export const FEED_TABS = ['recommended', 'popular', 'following', 'latest'] as const;

export type FeedTab = (typeof FEED_TABS)[number];
