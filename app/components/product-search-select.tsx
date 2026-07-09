"use client";

import { useCallback, useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';

import { useDebouncedValue } from '../hooks/use-debounced-value';
import type { AsyncOption } from './async-search-select';
import type { PosInvoiceType } from '../lib/types';

interface ProductSearchSelectProps {
    label?: string;
    placeholder?: string;
    className?: string;
    selectedId: string;
    selectedLabel?: string;
    onSelect: (id: string, label: string, raw?: unknown) => void;
    fetchOptions: (search: string) => Promise<AsyncOption[]>;
    invoiceType?: PosInvoiceType;
}

export function ProductSearchSelect({
    label,
    placeholder,
    className,
    selectedId,
    selectedLabel,
    onSelect,
    fetchOptions,
    invoiceType = 'sale',
}: ProductSearchSelectProps) {
    const [inputValue, setInputValue] = useState(selectedLabel ?? '');
    const [items, setItems] = useState<AsyncOption[]>([]);
    const [loading, setLoading] = useState(false);
    const debounced = useDebouncedValue(inputValue, 300);
    const ref = useRef<HTMLInputElement | null>(null);
    const skipShortTermClearRef = useRef(false);
    const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({ display: 'none' });
    const [open, setOpen] = useState(false);

    useEffect(() => {
        setInputValue(selectedLabel ?? '');
    }, [selectedLabel, selectedId]);

    useEffect(() => {
        let cancelled = false;
        const term = debounced.trim();
        // only fetch when user typed at least 2 chars to avoid noisy queries
        if (term.length < 2) {
            // if we recently performed a manual fetch for selectedId, don't clear
            if (skipShortTermClearRef.current) {
                return () => {
                    cancelled = true;
                };
            }

            setItems([]);
            setLoading(false);
            return () => {
                cancelled = true;
            };
        }

        setLoading(true);
        fetchOptions(term)
            .then((res) => {
                if (!cancelled) setItems(res);
            })
            .catch(() => {
                if (!cancelled) setItems([]);
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => {
            cancelled = true;
        };
    }, [debounced, fetchOptions]);

    const updateMenuPosition = useCallback(() => {
        const el = ref.current;
        if (!el) return;

        // Find the nearest ancestor container with class 'max-w-4xl' (invoice container)
        let container: HTMLElement | null = el.parentElement;
        while (container && !container.classList.contains('max-w-4xl')) {
            container = container.parentElement;
        }

        const inputRect = el.getBoundingClientRect();
        const top = inputRect.bottom + window.scrollY + 6;

        // Sisakan jarak dari tepi bawah viewport supaya kelihatan jelas ini
        // popup melayang (bukan menyatu dengan konten halaman) saat input-nya
        // berada di bagian bawah layar — dibatasi ke 50vh juga supaya di
        // layar tinggi tetap kompak.
        const bottomMargin = 16;
        const availableHeight = window.innerHeight - inputRect.bottom - 6 - bottomMargin;
        const maxHeight = `${Math.max(120, Math.min(availableHeight, window.innerHeight * 0.5))}px`;

        if (container) {
            const containerRect = container.getBoundingClientRect();
            setMenuStyle({
                position: 'fixed',
                left: containerRect.left + window.scrollX,
                width: containerRect.width,
                top,
                zIndex: 60,
                background: 'white',
                boxShadow: '0 6px 24px rgba(0,0,0,0.12)',
                borderRadius: 8,
                maxHeight,
                overflow: 'auto',
            });
        } else {
            // fallback: align to input width
            setMenuStyle({
                position: 'fixed',
                left: inputRect.left + window.scrollX,
                width: inputRect.width,
                top,
                zIndex: 60,
                background: 'white',
                boxShadow: '0 6px 24px rgba(0,0,0,0.12)',
                borderRadius: 8,
                maxHeight,
                overflow: 'auto',
            });
        }
    }, []);

    useEffect(() => {
        if (open) updateMenuPosition();
    }, [open, items, updateMenuPosition]);

    useEffect(() => {
        function onResize() {
            if (open) updateMenuPosition();
        }
        window.addEventListener('resize', onResize);
        window.addEventListener('scroll', onResize);
        return () => {
            window.removeEventListener('resize', onResize);
            window.removeEventListener('scroll', onResize);
        };
    }, [open, updateMenuPosition]);

    function clear() {
        setInputValue('');
        setItems([]);
        setOpen(false);
        onSelect('', '');
        ref.current?.focus();
    }

    return (
        <div className={className} style={{ position: 'relative' }}>
            <label className="block text-xs text-default-500 mb-1">{label}</label>
            <div style={{ position: 'relative' }}>
            <input
                ref={ref}
                className="w-full rounded-lg border px-3 py-2 pr-8"
                placeholder={placeholder ?? 'Ketik untuk mencari...'}
                value={inputValue}
                onChange={(e) => {
                    setInputValue(e.target.value);
                    // only open when user typed >=2 chars
                    if (e.target.value.trim().length >= 2) setOpen(true);
                }}
                onFocus={() => {
                    if (inputValue.trim().length >= 2) {
                        setOpen(true);
                        updateMenuPosition();
                        return;
                    }

                    // If item already selected, fetch its data to show details
                    if (selectedId) {
                        setOpen(true);
                        updateMenuPosition();
                        // prevent debounced short-term clear from wiping our manual fetch
                        skipShortTermClearRef.current = true;
                        setLoading(true);
                        fetchOptions(selectedLabel ?? selectedId)
                            .then((res) => {
                                setItems(res);
                            })
                            .catch(() => setItems([]))
                            .finally(() => {
                                setLoading(false);
                                // allow debounced effect to clear again later
                                setTimeout(() => {
                                    skipShortTermClearRef.current = false;
                                }, 500);
                            });
                        return;
                    }

                    updateMenuPosition();
                }}
                onBlur={() => {
                    // small delay to allow click
                    setTimeout(() => setOpen(false), 150);
                }}
            />
            {inputValue && (
                <button
                    type="button"
                    aria-label="Bersihkan"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-default-400 hover:text-default-600"
                    onMouseDown={(e) => {
                        e.preventDefault();
                        clear();
                    }}
                >
                    <X className="h-4 w-4" />
                </button>
            )}
            </div>

            {open && (
                <div style={menuStyle} role="listbox" className="divide-y divide-default-100 border text-sm">
                    {loading ? (
                        <div className="px-4 py-3 text-center text-default-400">Memuat...</div>
                    ) : items.length === 0 ? (
                        <div className="px-4 py-3 text-center text-default-400">Tidak ada hasil</div>
                    ) : (
                        items.map((it) => {
                            const p = it.raw as any;
                            const priceValue = invoiceType === 'purchase' ? p?.purchase_price : p?.sale_price;
                            const price = priceValue ? `Rp ${Number(priceValue).toLocaleString('id-ID')}` : '-';
                            const tags = p?.tags?.length ? p.tags.join(', ') : null;
                            const currentStock = p?.current_stock;
                            const lowStock = typeof currentStock === 'number' && typeof p?.min_stock === 'number' && currentStock <= p.min_stock;

                            return (
                                <div
                                    key={it.id}
                                    role="option"
                                    aria-selected={selectedId === it.id}
                                    className="flex cursor-pointer flex-col gap-2 px-4 py-3 hover:bg-default-100 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
                                    onMouseDown={(e) => {
                                        e.preventDefault();
                                        setInputValue(it.label);
                                        onSelect(it.id, it.label, it.raw);
                                        setOpen(false);
                                    }}
                                >
                                    <div className="min-w-0">
                                        <div className="font-medium">{it.label}</div>
                                        <div className="text-xs text-default-400">SKU: {p?.sku ?? '-'}</div>
                                        {p?.short_description && (
                                            <div className="text-xs text-default-400">{p.short_description}</div>
                                        )}
                                        {tags && <div className="mt-0.5 text-xs text-default-400">{tags}</div>}
                                    </div>
                                    <div className="flex shrink-0 items-center justify-between gap-4 sm:flex-col sm:items-end sm:justify-start sm:gap-1 sm:text-right">
                                        <span className={`text-xs ${lowStock ? 'font-medium text-danger' : 'text-default-500'}`}>
                                            Stok: {typeof currentStock === 'number' ? currentStock : '-'}
                                        </span>
                                        <span className="text-sm font-medium text-foreground">{price}</span>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            )}
        </div>
    );
}
