'use client';

import { useEffect, useRef, type RefObject } from 'react';

interface UseInfiniteScrollSentinelOptions {
  enabled: boolean;
  hasMore: boolean;
  loading: boolean;
  onLoadMore: () => void;
  rootMargin?: string;
}

/**
 * Observes a sentinel element and triggers pagination when it enters the viewport.
 *
 * @param options.enabled - Whether the observer should be active.
 * @param options.hasMore - Whether another page is available.
 * @param options.loading - Prevents duplicate requests while a page is loading.
 * @param options.onLoadMore - Callback invoked when the sentinel becomes visible.
 * @param options.rootMargin - Optional IntersectionObserver root margin.
 * @returns Ref to attach to the sentinel element.
 *
 * @example
 * const sentinelRef = useInfiniteScrollSentinel({ enabled: !isDesktop, hasMore: !!cursor, loading, onLoadMore: () => loadPage(cursor) });
 */
export function useInfiniteScrollSentinel({
  enabled,
  hasMore,
  loading,
  onLoadMore,
  rootMargin = '200px',
}: UseInfiniteScrollSentinelOptions): RefObject<HTMLDivElement | null> {
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!enabled || !hasMore) {
      return;
    }

    const node = sentinelRef.current;
    if (!node) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry?.isIntersecting && !loading) {
          onLoadMore();
        }
      },
      { rootMargin },
    );

    observer.observe(node);
    return () => {
      observer.disconnect();
    };
  }, [enabled, hasMore, loading, onLoadMore, rootMargin]);

  return sentinelRef;
}
