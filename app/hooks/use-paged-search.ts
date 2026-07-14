'use client';

import { useEffect, useRef, useState } from 'react';

import { useDebouncedValue } from './use-debounced-value';
import type { AsyncOption, PagedFetchOptions } from '../components/async-search-select';

interface UsePagedSearchOptions {
  fetchOptions: PagedFetchOptions;
  /** Fetch halaman 1 dipicu tiap kali ini jadi true (mis. saat modal dibuka) atau saat teks pencarian berubah selama true. */
  isActive: boolean;
  debounceMs?: number;
}

/**
 * Logika fetch server-side berpaginasi yang sama dipakai `AsyncSearchSelect`
 * & `ProductSearchSelect` — dulu diduplikasi persis di kedua file itu. Buka
 * (isActive true) → fetch halaman 1 (search kosong). Ketik → debounce →
 * fetch ulang dari halaman 1. `loadMore()` dipanggil saat list discroll ke
 * bawah untuk lazy load halaman berikutnya (append, bukan reset).
 */
export function usePagedSearch({ fetchOptions, isActive, debounceMs = 300 }: UsePagedSearchOptions) {
  const [filterText, setFilterText] = useState('');
  const [items, setItems] = useState<AsyncOption[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [highlighted, setHighlighted] = useState(0);

  const debouncedFilter = useDebouncedValue(filterText, debounceMs);
  const requestId = useRef(0);
  const loadingMoreRef = useRef(false);

  useEffect(() => {
    if (!isActive) return;
    const myRequest = ++requestId.current;
    setLoading(true);
    fetchOptions(debouncedFilter.trim(), 1)
      .then((res) => {
        if (myRequest !== requestId.current) return;
        setItems(res.items);
        setHasMore(res.hasMore);
        setPage(1);
        setHighlighted(0);
      })
      .catch(() => {
        if (myRequest !== requestId.current) return;
        setItems([]);
        setHasMore(false);
      })
      .finally(() => {
        if (myRequest !== requestId.current) return;
        setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, debouncedFilter, fetchOptions]);

  function loadMore() {
    if (loadingMoreRef.current || !hasMore) return;
    loadingMoreRef.current = true;
    const myRequest = requestId.current;
    const nextPage = page + 1;
    setLoadingMore(true);
    fetchOptions(debouncedFilter.trim(), nextPage)
      .then((res) => {
        if (myRequest !== requestId.current) return;
        setItems((prev) => [...prev, ...res.items]);
        setHasMore(res.hasMore);
        setPage(nextPage);
      })
      .catch(() => {
        if (myRequest !== requestId.current) return;
        setHasMore(false);
      })
      .finally(() => {
        loadingMoreRef.current = false;
        if (myRequest !== requestId.current) return;
        setLoadingMore(false);
      });
  }

  /** Reset total state — panggil saat modal ditutup supaya buka berikutnya mulai bersih. */
  function reset() {
    setFilterText('');
    setItems([]);
    setHighlighted(0);
    requestId.current++;
  }

  return {
    filterText,
    setFilterText,
    items,
    loading,
    loadingMore,
    hasMore,
    highlighted,
    setHighlighted,
    loadMore,
    reset,
  };
}
