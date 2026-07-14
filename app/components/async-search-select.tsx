'use client';

import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { ChevronDown, Plus } from 'lucide-react';

import { useDebouncedValue } from '../hooks/use-debounced-value';
import { PopoverPortal } from './popover-portal';

const CREATE_NEW_KEY = '__create_new__';
/** Jarak (px) dari dasar list saat scroll dianggap "hampir mentok" — pemicu lazy load halaman berikutnya. */
const LOAD_MORE_THRESHOLD = 48;

export interface AsyncOption {
  id: string;
  label: string;
  description?: string;
  /** Data asli di balik opsi ini (mis. entity produk lengkap) — diteruskan balik lewat `onSelect` supaya caller bisa ambil field lain (harga default, dst) tanpa fetch ulang. */
  raw?: unknown;
}

export interface PagedFetchResult {
  items: AsyncOption[];
  /** Apakah masih ada halaman berikutnya untuk `search` yang sama. */
  hasMore: boolean;
}

/** Kontrak fetch server-side dengan paginasi — `page` 1-based, dipanggil ulang dari halaman 1 tiap kali `search` berubah. */
export type PagedFetchOptions = (search: string, page: number) => Promise<PagedFetchResult>;

interface AsyncSearchSelectProps {
  label?: string;
  placeholder?: string;
  isRequired?: boolean;
  isDisabled?: boolean;
  className?: string;
  selectedId: string;
  /** Label item terpilih — ditampilkan di tombol pemicu tanpa perlu fetch ulang. */
  selectedLabel?: string;
  onSelect: (id: string, label: string, raw?: unknown) => void;
  fetchOptions: PagedFetchOptions;
  /** Kalau diisi, muncul opsi "+ Tambah ..." di bawah hasil saat teks yang diketik tidak persis cocok dengan opsi manapun. */
  onCreateNew?: (query: string) => void;
  /** Label opsi "+ Tambah ..." — default `Tambah "{query}"`. */
  createNewLabel?: (query: string) => string;
}

/**
 * Combobox pencarian server-side ala Select2 — field utama tombol pemicu
 * (tidak bisa diketik langsung), search box ada DI DALAM menu yang baru
 * muncul saat dibuka. Saat dibuka: fetch 10 hasil pertama (search kosong).
 * Ketik → debounce 300ms → fetch ulang dari halaman 1. Scroll list ke bawah
 * → lazy load halaman berikutnya (append), dipakai untuk data yang terus
 * bertambah (kontak, jasa) sehingga tidak realistis di-preload semua sekali
 * seperti `LocationSelect`.
 */
export function AsyncSearchSelect({
  label,
  placeholder,
  isRequired,
  isDisabled,
  className,
  selectedId,
  selectedLabel,
  onSelect,
  fetchOptions,
  onCreateNew,
  createNewLabel,
}: AsyncSearchSelectProps) {
  const [open, setOpen] = useState(false);
  const [filterText, setFilterText] = useState('');
  const [items, setItems] = useState<AsyncOption[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [highlighted, setHighlighted] = useState(0);

  const debouncedFilter = useDebouncedValue(filterText, 300);
  const requestId = useRef(0);
  const loadingMoreRef = useRef(false);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
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
  }, [open, debouncedFilter, fetchOptions]);

  useEffect(() => {
    if (open) requestAnimationFrame(() => searchRef.current?.focus());
  }, [open]);

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

  function handleListScroll() {
    const el = listRef.current;
    if (!el) return;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < LOAD_MORE_THRESHOLD) loadMore();
  }

  function closeMenu() {
    setOpen(false);
    setFilterText('');
    setItems([]);
    setHighlighted(0);
    requestId.current++;
  }

  const trimmedInput = filterText.trim();
  const hasExactMatch = items.some((o) => o.label.toLowerCase() === trimmedInput.toLowerCase());
  const showCreateOption = Boolean(onCreateNew) && trimmedInput.length > 0 && !hasExactMatch;
  const displayItems: AsyncOption[] = showCreateOption
    ? [...items, { id: CREATE_NEW_KEY, label: createNewLabel ? createNewLabel(trimmedInput) : `Tambah "${trimmedInput}"` }]
    : items;

  function selectOption(opt: AsyncOption) {
    if (opt.id === CREATE_NEW_KEY) {
      onCreateNew?.(trimmedInput);
      closeMenu();
      return;
    }
    onSelect(opt.id, opt.label, opt.raw);
    closeMenu();
    triggerRef.current?.focus();
  }

  function handleSearchKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') {
      e.preventDefault();
      closeMenu();
      triggerRef.current?.focus();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlighted((h) => Math.min(h + 1, displayItems.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlighted((h) => Math.max(h - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const opt = displayItems[highlighted];
      if (opt) selectOption(opt);
    }
  }

  return (
    <div className={className}>
      {label && (
        <label className="mb-1 block text-xs text-default-500">
          {label}
          {isRequired && <span className="text-danger"> *</span>}
        </label>
      )}

      <button
        ref={triggerRef}
        type="button"
        disabled={isDisabled}
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between rounded-lg border border-default-200 bg-white px-3 py-2 text-left text-sm transition-colors hover:border-default-300 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span className={selectedLabel ? 'text-foreground' : 'text-default-400'}>
          {selectedLabel || placeholder || 'Pilih...'}
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-default-400" />
      </button>

      <PopoverPortal anchorRef={triggerRef} isOpen={open} onClose={closeMenu} matchAnchorWidth>
        <div className="rounded-lg border border-default-200 bg-white shadow-lg">
          <div className="border-b border-default-100 p-2">
            <input
              ref={searchRef}
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Ketik untuk mencari..."
              className="w-full rounded-md border border-default-200 px-2 py-1.5 text-sm outline-none focus:border-primary"
            />
          </div>
          <div
            ref={listRef}
            onScroll={handleListScroll}
            role="listbox"
            className="max-h-60 overflow-auto overscroll-contain py-1 text-sm"
          >
            {loading ? (
              <div className="px-3 py-2 text-center text-default-400">Memuat...</div>
            ) : displayItems.length === 0 ? (
              <div className="px-3 py-2 text-center text-default-400">Tidak ada hasil</div>
            ) : (
              <>
                {displayItems.map((opt, idx) => (
                  <div
                    key={opt.id}
                    role="option"
                    aria-selected={opt.id === selectedId}
                    onMouseEnter={() => setHighlighted(idx)}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      selectOption(opt);
                    }}
                    className={`flex cursor-pointer items-center gap-1.5 px-3 py-2 ${idx === highlighted ? 'bg-default-100' : ''} ${
                      opt.id === CREATE_NEW_KEY ? 'font-medium text-primary' : opt.id === selectedId ? 'font-medium text-primary' : ''
                    }`}
                  >
                    {opt.id === CREATE_NEW_KEY && <Plus className="h-3.5 w-3.5 shrink-0" />}
                    <div className="flex flex-col">
                      <span>{opt.label}</span>
                      {opt.description && <span className="text-xs text-default-400">{opt.description}</span>}
                    </div>
                  </div>
                ))}
                {loadingMore && <div className="px-3 py-2 text-center text-default-400">Memuat lebih banyak...</div>}
              </>
            )}
          </div>
        </div>
      </PopoverPortal>
    </div>
  );
}
