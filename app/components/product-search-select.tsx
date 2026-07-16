'use client';

import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { ChevronDown } from 'lucide-react';

import { AppModal } from './app-modal';
import { usePagedSearch } from '../hooks/use-paged-search';
import type { AsyncOption, PagedFetchOptions } from './async-search-select';
import type { PosInvoiceType, PosProduct } from '../lib/types';

const LOAD_MORE_THRESHOLD = 48;

/**
 * Label produk berformat "Nama Barang (SKU)" — kalau nama-nya panjang,
 * truncate biasa (ellipsis di akhir) menyembunyikan SKU yang justru paling
 * penting buat identifikasi. Pecah di "(" terakhir supaya bagian SKU selalu
 * utuh terlihat, dan ellipsis jatuh di antara nama & SKU (bukan di akhir).
 */
function splitProductLabel(label: string): { head: string; tail: string } {
  const idx = label.lastIndexOf(' (');
  if (idx === -1) return { head: label, tail: '' };
  return { head: label.slice(0, idx), tail: label.slice(idx) };
}

interface ProductSearchSelectProps {
  label?: string;
  placeholder?: string;
  className?: string;
  selectedId: string;
  selectedLabel?: string;
  onSelect: (id: string, label: string, raw?: unknown) => void;
  fetchOptions: PagedFetchOptions;
  invoiceType?: PosInvoiceType;
  /** Tampilkan baris harga beli di modal (mis. cost/margin) — default true, dikontrol via toggle di pemanggil. */
  showPurchasePrice?: boolean;
}

/**
 * Pencarian produk — tombol pemicu membuka modal berisi search box + list
 * hasil (info stok/harga per baris), bukan dropdown mengambang. Dipindah
 * dari pola dropdown karena setelah diuji, dropdown sangat tidak nyaman di
 * mobile. Buka pertama kali → 10 produk pertama; ketik → debounce 300ms cari
 * ulang; scroll list ke bawah → lazy load halaman berikutnya. Bukan reuse
 * `AsyncSearchSelect` karena butuh render per-item yang lebih kaya (stok,
 * harga sesuai tipe faktur) daripada label+deskripsi biasa.
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

  function selectOption(opt: AsyncOption) {
    onSelect(opt.id, opt.label, opt.raw);
    closeMenu();
  }

  function handleSearchKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
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

  const { head, tail } = selectedLabel ? splitProductLabel(selectedLabel) : { head: '', tail: '' };

  return (
    <div className={className}>
      {label && <label className="mb-1 block text-xs text-default-500">{label}</label>}

      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-between rounded-lg border border-default-200 bg-white px-3 py-2 text-left text-sm transition-colors hover:border-default-300"
      >
        {selectedLabel ? (
          <span className="flex min-w-0 flex-1 text-foreground">
            <span className="truncate">{head}</span>
            <span className="shrink-0 whitespace-nowrap">{tail}</span>
          </span>
        ) : (
          <span className="truncate text-default-400">{placeholder || 'Cari produk...'}</span>
        )}
        <ChevronDown className="h-4 w-4 shrink-0 text-default-400" />
      </button>

      <AppModal isOpen={open} onClose={closeMenu} title={label || 'Cari Produk'} size="md">
        <div className="-mx-5 -my-5 flex h-[70vh] max-h-[560px] flex-col sm:-mx-6">
          <div className="shrink-0 border-b border-default-100 p-3">
            <input
              ref={searchRef}
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Cari nama, SKU, atau tag..."
              className="w-full rounded-md border border-default-200 px-3 py-2 text-base outline-none focus:border-primary"
            />
          </div>
          <div
            ref={listRef}
            onScroll={handleListScroll}
            role="listbox"
            className="flex-1 divide-y divide-default-100 overflow-y-auto text-sm"
          >
            {loading ? (
              <div className="px-4 py-4 text-center text-default-400">Memuat...</div>
            ) : items.length === 0 ? (
              <div className="px-4 py-4 text-center text-default-400">Tidak ada hasil</div>
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
                      className={`flex cursor-pointer flex-col gap-2 px-4 py-3 active:bg-default-100 sm:flex-row sm:items-center sm:justify-between sm:gap-4 ${
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
      </AppModal>
    </div>
  );
}
