'use client';

import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { ChevronDown } from 'lucide-react';

import { useDebouncedValue } from '../hooks/use-debounced-value';
import { PopoverPortal } from './popover-portal';
import type { AsyncOption, PagedFetchOptions } from './async-search-select';
import type { PosInvoiceType, PosProduct } from '../lib/types';

const LOAD_MORE_THRESHOLD = 48;

interface ProductSearchSelectProps {
  label?: string;
  placeholder?: string;
  className?: string;
  selectedId: string;
  selectedLabel?: string;
  onSelect: (id: string, label: string, raw?: unknown) => void;
  fetchOptions: PagedFetchOptions;
  invoiceType?: PosInvoiceType;
  /** Tampilkan baris harga beli di dropdown (mis. cost/margin) — default true, dikontrol via toggle di pemanggil. */
  showPurchasePrice?: boolean;
}

/**
 * Dropdown pencarian produk ala Select2 — field utama tombol pemicu (tidak
 * bisa diketik langsung), search box + info stok/harga per baris ada DI
 * DALAM menu. Buka pertama kali → 10 produk pertama; ketik → debounce 300ms
 * cari ulang dari halaman 1; scroll list ke bawah → lazy load halaman
 * berikutnya. Bukan reuse `AsyncSearchSelect` karena butuh render per-item
 * yang lebih kaya (stok, harga sesuai tipe faktur) daripada label+deskripsi biasa.
 */
export function ProductSearchSelect({
  label,
  placeholder,
  className,
  selectedId,
  selectedLabel,
  onSelect,
  fetchOptions,
  invoiceType = 'sale',
  showPurchasePrice = true,
}: ProductSearchSelectProps) {
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

  function selectOption(opt: AsyncOption) {
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
      setHighlighted((h) => Math.min(h + 1, items.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlighted((h) => Math.max(h - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const opt = items[highlighted];
      if (opt) selectOption(opt);
    }
  }

  return (
    <div className={className}>
      {label && <label className="mb-1 block text-xs text-default-500">{label}</label>}

      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between rounded-lg border border-default-200 bg-white px-3 py-2 text-left text-sm transition-colors hover:border-default-300"
      >
        <span className={selectedLabel ? 'truncate text-foreground' : 'truncate text-default-400'}>
          {selectedLabel || placeholder || 'Cari produk...'}
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
              placeholder="Cari nama, SKU, atau tag..."
              // text-base (bukan text-sm) sengaja — di bawah 16px, Safari/Chrome mobile auto-zoom saat fokus.
              className="w-full rounded-md border border-default-200 px-2 py-1.5 text-base outline-none focus:border-primary"
            />
          </div>
          <div
            ref={listRef}
            onScroll={handleListScroll}
            role="listbox"
            className="max-h-72 divide-y divide-default-100 overflow-auto overscroll-contain text-sm"
          >
            {loading ? (
              <div className="px-4 py-3 text-center text-default-400">Memuat...</div>
            ) : items.length === 0 ? (
              <div className="px-4 py-3 text-center text-default-400">Tidak ada hasil</div>
            ) : (
              <>
                {items.map((it, idx) => {
                  const p = it.raw as PosProduct | undefined;
                  const purchasePrice = p?.purchase_price ? `Rp ${Number(p.purchase_price).toLocaleString('id-ID')}` : '-';
                  const salePrice = p?.sale_price ? `Rp ${Number(p.sale_price).toLocaleString('id-ID')}` : '-';
                  const isPurchaseRelevant = invoiceType === 'purchase';
                  const tags = p?.tags?.length ? p.tags.join(', ') : null;
                  const currentStock = p?.current_stock;
                  const lowStock =
                    typeof currentStock === 'number' && typeof p?.min_stock === 'number' && currentStock <= p.min_stock;

                  return (
                    <div
                      key={it.id}
                      role="option"
                      aria-selected={selectedId === it.id}
                      onMouseEnter={() => setHighlighted(idx)}
                      onClick={() => selectOption(it)}
                      className={`flex cursor-pointer flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4 ${
                        idx === highlighted ? 'bg-default-100' : ''
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="font-medium">{it.label}</div>
                        <div className="text-xs text-default-400">SKU: {p?.sku ?? '-'}</div>
                        {tags && <div className="mt-0.5 text-xs text-default-400">{tags}</div>}
                      </div>
                      <div className="flex shrink-0 items-center justify-between gap-4 sm:flex-col sm:items-end sm:justify-start sm:gap-1 sm:text-right">
                        <span className={`text-xs ${lowStock ? 'font-medium text-danger' : 'text-default-500'}`}>
                          Stok: {typeof currentStock === 'number' ? currentStock : '-'}
                        </span>
                        <div className="flex gap-3 text-xs sm:flex-col sm:items-end sm:gap-0.5">
                          {showPurchasePrice && (
                            <span className={isPurchaseRelevant ? 'font-medium text-foreground' : 'text-default-400'}>
                              Beli: {purchasePrice}
                            </span>
                          )}
                          <span className={!isPurchaseRelevant ? 'font-medium text-foreground' : 'text-default-400'}>
                            Jual: {salePrice}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {loadingMore && <div className="px-4 py-2 text-center text-default-400">Memuat lebih banyak...</div>}
              </>
            )}
          </div>
        </div>
      </PopoverPortal>
    </div>
  );
}
