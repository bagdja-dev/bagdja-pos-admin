'use client';

import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { ChevronDown, Plus } from 'lucide-react';

import { AppModal } from './app-modal';
import { apiClient } from '../lib/api-client';
import { LOCATION_TYPE_LABELS, type GridResult, type PosLocation } from '../lib/types';

const CREATE_NEW_KEY = '__create_new__';

interface LocationOption {
  id: string;
  label: string;
  description?: string;
}

interface LocationSelectProps {
  label?: string;
  placeholder?: string;
  isRequired?: boolean;
  isDisabled?: boolean;
  className?: string;
  businessId: string;
  selectedId: string;
  onSelect: (id: string, label: string) => void;
  /** Kecualikan satu lokasi dari daftar (mis. lokasi asal saat memilih lokasi tujuan mutasi). */
  excludeId?: string;
  /** Kalau diisi, muncul opsi "+ Tambah ..." di bawah hasil saat teks yang diketik tidak persis cocok dengan lokasi manapun — sama seperti pola `AsyncSearchSelect`. */
  onCreateNew?: (query: string) => void;
  /** Label opsi "+ Tambah ..." — default `Tambah "{query}"`. */
  createNewLabel?: (query: string) => string;
  /** Ubah nilainya (mis. counter increment) untuk memaksa daftar lokasi di-fetch ulang — dipakai setelah lokasi baru dibuat lewat `onCreateNew` supaya langsung muncul di daftar. */
  refreshToken?: number;
}

/**
 * Pemilih lokasi — tombol pemicu membuka modal berisi search box + list
 * lokasi (bukan dropdown mengambang). Semua lokasi bisnis di-preload sekali
 * (maks 100, batas grid API) lalu difilter di client saat mengetik — jumlah
 * lokasi per bisnis realistis kecil sehingga preload sekali lebih simpel &
 * instan dibanding pencarian server-side.
 */
export function LocationSelect({
  label,
  placeholder,
  isRequired,
  isDisabled,
  className,
  businessId,
  selectedId,
  onSelect,
  excludeId,
  onCreateNew,
  createNewLabel,
  refreshToken,
}: LocationSelectProps) {
  const [locations, setLocations] = useState<PosLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [filterText, setFilterText] = useState('');
  const [highlighted, setHighlighted] = useState(0);

  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!businessId) return;
    let cancelled = false;
    setLoading(true);
    apiClient<GridResult<PosLocation>>(`/api/businesses/${businessId}/locations?size=100`)
      .then((res) => {
        if (!cancelled) setLocations(res.data);
      })
      .catch(() => {
        if (!cancelled) setLocations([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [businessId, refreshToken]);

  const options: LocationOption[] = locations
    .filter((l) => l.id !== excludeId)
    .map((l) => ({ id: l.id, label: l.name, description: LOCATION_TYPE_LABELS[l.type] ?? l.type }));

  const filtered = filterText.trim()
    ? options.filter((o) => o.label.toLowerCase().includes(filterText.trim().toLowerCase()))
    : options;

  const trimmedInput = filterText.trim();
  const hasExactMatch = filtered.some((o) => o.label.toLowerCase() === trimmedInput.toLowerCase());
  const showCreateOption = Boolean(onCreateNew) && trimmedInput.length > 0 && !hasExactMatch;
  const displayOptions: LocationOption[] = showCreateOption
    ? [...filtered, { id: CREATE_NEW_KEY, label: createNewLabel ? createNewLabel(trimmedInput) : `Tambah "${trimmedInput}"` }]
    : filtered;

  const selected = options.find((o) => o.id === selectedId);

  useEffect(() => {
    if (!open) return;
    setHighlighted(0);
    requestAnimationFrame(() => searchRef.current?.focus());
  }, [open]);

  function closeMenu() {
    setOpen(false);
    setFilterText('');
    setHighlighted(0);
  }

  function selectOption(opt: LocationOption) {
    if (opt.id === CREATE_NEW_KEY) {
      onCreateNew?.(trimmedInput);
      closeMenu();
      return;
    }
    onSelect(opt.id, opt.label);
    closeMenu();
  }

  function handleSearchKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlighted((h) => Math.min(h + 1, displayOptions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlighted((h) => Math.max(h - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const opt = displayOptions[highlighted];
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
        <span className={selected ? 'truncate text-foreground' : 'truncate text-default-400'}>
          {selected ? selected.label : loading ? 'Memuat lokasi...' : (placeholder ?? 'Pilih lokasi...')}
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-default-400" />
      </button>

      <AppModal isOpen={open} onClose={closeMenu} title={label || 'Pilih Lokasi'} size="sm">
        <div className="-mx-5 -my-5 flex h-[70vh] max-h-[520px] flex-col sm:-mx-6">
          <div className="shrink-0 border-b border-default-100 p-3">
            <input
              ref={searchRef}
              value={filterText}
              onChange={(e) => {
                setFilterText(e.target.value);
                setHighlighted(0);
              }}
              onKeyDown={handleSearchKeyDown}
              placeholder="Cari lokasi..."
              className="w-full rounded-md border border-default-200 px-3 py-2 text-base outline-none focus:border-primary"
            />
          </div>
          <div className="flex-1 overflow-y-auto py-1 text-sm" role="listbox">
            {displayOptions.length === 0 ? (
              <div className="px-3 py-4 text-center text-default-400">Tidak ada hasil</div>
            ) : (
              displayOptions.map((opt, idx) => (
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
              ))
            )}
          </div>
        </div>
      </AppModal>
    </div>
  );
}
