'use client';

import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { ChevronDown, Plus } from 'lucide-react';

import { AppModal } from './app-modal';
import { usePagedSearch } from '../hooks/use-paged-search';

const CREATE_NEW_KEY = '__create_new__';
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
 * Combobox pencarian server-side — tombol pemicu membuka modal berisi search
 * box + list hasil (bukan dropdown mengambang). Dipindah dari pola dropdown
 * (Autocomplete/popover) karena setelah diuji, dropdown sangat tidak nyaman
 * di mobile (tertutup sendiri akibat keyboard virtual, scroll list susah).
 * Modal tidak butuh positioning relatif ke anchor sama sekali, jadi kelas
 * masalah itu tidak ada lagi. Buka → fetch 10 hasil pertama (search kosong).
 * Ketik → debounce 300ms → fetch ulang. Scroll list ke bawah → lazy load
 * halaman berikutnya.
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
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const { filterText, setFilterText, items, loading, loadingMore, highlighted, setHighlighted, loadMore, reset } =
    usePagedSearch({ fetchOptions, isActive: open });

  useEffect(() => {
    if (open) requestAnimationFrame(() => searchRef.current?.focus());
  }, [open]);

  function handleListScroll() {
    const el = listRef.current;
    if (!el) return;
    if (el.scrollHeight - el.scrollTop - el.clientHeight < LOAD_MORE_THRESHOLD) loadMore();
  }

  function closeMenu() {
    setOpen(false);
    reset();
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
  }

  function handleSearchKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
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
        type="button"
        disabled={isDisabled}
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-between rounded-lg border border-default-200 bg-white px-3 py-2 text-left text-sm transition-colors hover:border-default-300 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span className={selectedLabel ? 'truncate text-foreground' : 'truncate text-default-400'}>
          {selectedLabel || placeholder || 'Pilih...'}
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-default-400" />
      </button>

      <AppModal isOpen={open} onClose={closeMenu} title={label || placeholder || 'Pilih'} size="sm">
        <div className="-mx-5 -my-5 flex h-[70vh] max-h-[520px] flex-col sm:-mx-6">
          <div className="shrink-0 border-b border-default-100 p-3">
            <input
              ref={searchRef}
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Ketik untuk mencari..."
              className="w-full rounded-md border border-default-200 px-3 py-2 text-base outline-none focus:border-primary"
            />
          </div>
          <div ref={listRef} onScroll={handleListScroll} role="listbox" className="flex-1 overflow-y-auto py-1 text-sm">
            {loading ? (
              <div className="px-3 py-4 text-center text-default-400">Memuat...</div>
            ) : displayItems.length === 0 ? (
              <div className="px-3 py-4 text-center text-default-400">Tidak ada hasil</div>
            ) : (
              <>
                {displayItems.map((opt, idx) => (
                  <div
                    key={opt.id}
                    role="option"
                    aria-selected={opt.id === selectedId}
                    onMouseEnter={() => setHighlighted(idx)}
                    onClick={() => selectOption(opt)}
                    className={`flex cursor-pointer items-center gap-1.5 px-4 py-3 active:bg-default-100 ${idx === highlighted ? 'bg-default-100' : ''} ${
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
      </AppModal>
    </div>
  );
}
