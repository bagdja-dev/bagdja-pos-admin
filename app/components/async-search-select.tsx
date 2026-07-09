'use client';

import { useEffect, useRef, useState } from 'react';
import { Autocomplete, AutocompleteItem } from '@heroui/react';
import { Plus } from 'lucide-react';

import { useDebouncedValue } from '../hooks/use-debounced-value';

const CREATE_NEW_KEY = '__create_new__';

export interface AsyncOption {
  id: string;
  label: string;
  description?: string;
  /** Data asli di balik opsi ini (mis. entity produk lengkap) — diteruskan balik lewat `onSelect` supaya caller bisa ambil field lain (harga default, dst) tanpa fetch ulang. */
  raw?: unknown;
}

interface AsyncSearchSelectProps {
  label?: string;
  placeholder?: string;
  isRequired?: boolean;
  isDisabled?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  selectedId: string;
  /** Label item terpilih — dipakai untuk menampilkan teks awal (mis. saat edit) tanpa perlu fetch ulang. */
  selectedLabel?: string;
  onSelect: (id: string, label: string, raw?: unknown) => void;
  /** Query ke server (endpoint sudah pakai standar grid `?search=`), dipanggil ter-debounce 300ms. */
  fetchOptions: (search: string) => Promise<AsyncOption[]>;
  /** Kalau diisi, muncul opsi "+ Tambah ..." di bawah hasil saat teks yang diketik tidak persis cocok dengan opsi manapun. */
  onCreateNew?: (query: string) => void;
  /** Label opsi "+ Tambah ..." — default `Tambah "{query}"`. */
  createNewLabel?: (query: string) => string;
  /** Jika true, menu akan dipaksa penuh selebar halaman dan tidak menggunakan Autocomplete menu. (untuk produk gunakan `ProductSearchSelect` instead) */
  menuFullWidth?: boolean;
}

/**
 * Combobox pencarian server-side (mirip Select2) — dipakai untuk dropdown
 * yang datanya bisa terus bertambah (lokasi, kontak, produk) sehingga tidak
 * realistis di-preload semua ke client. Ketik → debounce 300ms → `fetchOptions`
 * dipanggil ulang dengan query terbaru (lewat endpoint grid `?search=`).
 */
export function AsyncSearchSelect({
  label,
  placeholder,
  isRequired,
  isDisabled,
  className,
  size = 'md',
  selectedId,
  selectedLabel,
  onSelect,
  fetchOptions,
  onCreateNew,
  createNewLabel,
}: AsyncSearchSelectProps) {
  const [inputValue, setInputValue] = useState(selectedLabel ?? '');
  const [items, setItems] = useState<AsyncOption[]>([]);
  const [loading, setLoading] = useState(false);
  const debouncedInput = useDebouncedValue(inputValue, 300);
  const skipNextFetch = useRef(false);

  useEffect(() => {
    setInputValue(selectedLabel ?? '');
  }, [selectedLabel, selectedId]);

  useEffect(() => {
    if (skipNextFetch.current) {
      skipNextFetch.current = false;
      return;
    }

    const trimmedDebouncedInput = debouncedInput.trim();
    const shouldFetch = trimmedDebouncedInput.length > 0 && !selectedId;

    if (!shouldFetch) {
      setItems([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    fetchOptions(trimmedDebouncedInput)
      .then((opts) => {
        if (!cancelled) setItems(opts);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedInput, fetchOptions, selectedId]);

  const trimmedInput = inputValue.trim();
  const hasExactMatch = items.some((o) => o.label.toLowerCase() === trimmedInput.toLowerCase());
  const showCreateOption = Boolean(onCreateNew) && trimmedInput.length > 0 && !hasExactMatch;
  const displayItems: AsyncOption[] = showCreateOption
    ? [...items, { id: CREATE_NEW_KEY, label: createNewLabel ? createNewLabel(trimmedInput) : `Tambah "${trimmedInput}"` }]
    : items;

  return (
    <Autocomplete
      label={label}
      placeholder={placeholder ?? 'Ketik untuk mencari...'}
      isRequired={isRequired}
      isDisabled={isDisabled}
      className={className}
      size={size}
      inputValue={inputValue}
      onInputChange={setInputValue}
      items={displayItems}
      isLoading={loading}
      selectedKey={selectedId || null}
      onSelectionChange={(key) => {
        if (!key) {
          onSelect('', '');
          return;
        }
        if (key === CREATE_NEW_KEY) {
          onCreateNew?.(trimmedInput);
          return;
        }
        const opt = items.find((o) => o.id === key);
        if (opt) {
          skipNextFetch.current = true;
          setInputValue(opt.label);
          onSelect(opt.id, opt.label, opt.raw);
        }
      }}
      onClear={() => onSelect('', '')}
      allowsCustomValue={false}
      menuTrigger="input"
    >
      {(item: AsyncOption) =>
        item.id === CREATE_NEW_KEY ? (
          <AutocompleteItem key={item.id} textValue={item.label} className="text-primary">
            <div className="flex items-center gap-1.5 font-medium">
              <Plus className="h-3.5 w-3.5" />
              {item.label}
            </div>
          </AutocompleteItem>
        ) : (
          <AutocompleteItem key={item.id} textValue={item.label}>
            <div className="flex flex-col">
              <span>{item.label}</span>
              {item.description && <span className="text-xs text-default-400">{item.description}</span>}
            </div>
          </AutocompleteItem>
        )
      }
    </Autocomplete>
  );
}
