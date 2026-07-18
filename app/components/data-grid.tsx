'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Select, SelectItem } from '@heroui/react';
import {
  Search,
  SlidersHorizontal,
  Filter,
  X,
  ChevronUp,
  ChevronDown,
  Inbox,
  Settings,
  RefreshCcw,
  LayoutGrid,
  Rows3,
  MonitorSmartphone,
} from 'lucide-react';

import { useDebouncedValue } from '../hooks/use-debounced-value';
import { AsyncSearchSelect, type PagedFetchOptions } from './async-search-select';
import { PopoverPortal } from './popover-portal';
import type { GridResult } from '../lib/types';

/**
 * Port dari `DataGrid` di `core/bagdja-console/src/components/DataGrid.tsx`
 * (standar grid platform Bagdja — lihat `core/docs/STANDARDIZATION_GRID_DATA.md`)
 * — struktur/behavior sama, warna diadaptasi ke token HeroUI (light theme)
 * yang dipakai di app ini, dan search di-debounce (gap yang belum ada di versi asli).
 */

export interface GridColumnRenderContext {
  /** True kalau dirender di dalam kartu (mode mobile), false/undefined di baris tabel — dipakai kalau sebuah kolom perlu tampilan beda antar mode (mis. tag yang perlu wrap di kartu tapi nowrap+scroll di tabel). */
  isCard: boolean;
}

export interface GridColumn<T = any> {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string;
  render?: (value: any, row: T, context?: GridColumnRenderContext) => ReactNode;
}

export interface FilterField {
  key: string;
  label: string;
  type: 'text' | 'select' | 'async-select';
  options?: { label: string; value: string }[];
  placeholder?: string;
  /** Cuma dipakai untuk type='async-select' — cari server-side lewat modal (`AsyncSearchSelect`), dipakai kalau opsinya terlalu banyak/dinamis untuk `select` biasa (mis. pilih satu kontak/lokasi tertentu sebagai filter). */
  fetchOptions?: PagedFetchOptions;
}

export interface FetchParams {
  page: number;
  size: number;
  search: string;
  filter: Record<string, string>;
  sort: string;
}

type ViewMode = 'auto' | 'table' | 'card';

interface DataGridProps<T = any> {
  title?: string;
  description?: string;
  columns: GridColumn<T>[];
  fetchData: (params: FetchParams) => Promise<GridResult<T>>;
  filterFields?: FilterField[];
  onRowClick?: (row: T) => void;
  emptyState?: { title: string; description: string; icon?: ReactNode };
  refreshTrigger?: unknown;
  defaultSort?: string;
  rowKey?: (row: T) => string;
  /** Render kartu kustom per baris untuk mode mobile — kalau tidak diisi, fallback ke kartu generik (label:value per kolom). */
  renderCard?: (row: T) => ReactNode;
}

export function DataGrid<T = any>({
  title,
  description,
  columns,
  fetchData,
  filterFields = [],
  onRowClick,
  emptyState,
  refreshTrigger,
  defaultSort = 'created_at:desc',
  rowKey,
  renderCard,
}: DataGridProps<T>) {
  const [data, setData] = useState<T[]>([]);
  const [meta, setMeta] = useState<GridResult<T>['meta'] | null>(null);
  const [loading, setLoading] = useState(false);

  const [page, setPage] = useState(1);
  const [size, setSize] = useState(20);
  const [searchInput, setSearchInput] = useState('');
  const search = useDebouncedValue(searchInput, 350);
  const [filter, setFilter] = useState<Record<string, string>>({});
  const [tempFilter, setTempFilter] = useState<Record<string, string>>({});
  // Label tampilan untuk filter `type='async-select'` — `filter`/`tempFilter`
  // cuma menyimpan id (dikirim ke backend), jadi label-nya perlu disimpan
  // terpisah supaya chip "Filter aktif" & tombol AsyncSearchSelect bisa
  // menampilkan nama, bukan UUID mentah.
  const [asyncLabels, setAsyncLabels] = useState<Record<string, string>>({});
  const [sort, setSort] = useState(defaultSort);
  const [viewMode, setViewMode] = useState<ViewMode>('auto');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const filterButtonRef = useRef<HTMLButtonElement>(null);
  const settingsButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setPage(1);
  }, [search, filter]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchData({ page, size, search, filter, sort });
      setData(res.data || []);
      setMeta(res.meta || null);
    } catch (err) {
      console.error('DataGrid fetch error:', err);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchData, page, size, search, filter, sort, refreshTrigger]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  function handleSort(key: string) {
    const [sortKey, sortDir] = sort.split(':');
    const nextDir = sortKey === key && sortDir === 'asc' ? 'desc' : 'asc';
    setSort(`${key}:${nextDir}`);
    setPage(1);
  }

  function clearAllFilters() {
    setSearchInput('');
    setFilter({});
    setTempFilter({});
    setAsyncLabels({});
    setPage(1);
  }

  const hasActiveFilters = Object.keys(filter).length > 0 || Boolean(search);
  const totalPages = meta ? meta.totalPages || Math.ceil(meta.totalItems / meta.itemsPerPage) || 1 : 1;
  const sortableColumns = columns.filter((c) => c.sortable);
  const [activeSortKey, activeSortDir] = sort.split(':');

  function applySort(key: string, dir: string) {
    setSort(`${key}:${dir}`);
    setPage(1);
  }

  /**
   * Fallback kartu generik (label:value per kolom) dipakai kalau caller tidak
   * menyediakan `renderCard`. Kolom `actions` sengaja dipisah ke baris bawah
   * (bukan ikut label:value biasa) supaya tombol Edit/Hapus yang biasanya ada
   * di sana tetap bisa dijangkau — beberapa halaman grid tidak punya
   * `onRowClick`, jadi kolom itu satu-satunya jalan ke aksi tersebut.
   */
  function renderDefaultCard(row: T) {
    const actionsCol = columns.find((c) => c.key === 'actions');
    const infoCols = columns.filter((c) => c.key !== 'actions');

    return (
      <div className="space-y-2 rounded-xl border border-default-200 bg-white p-4">
        {infoCols.map((col) => (
          <div key={col.key} className="flex items-start justify-between gap-3 text-sm">
            <span className="shrink-0 text-default-500">{col.label}</span>
            <span className="text-right text-foreground">
              {col.render
                ? col.render((row as Record<string, unknown>)[col.key], row, { isCard: true })
                : String((row as Record<string, unknown>)[col.key] ?? '—')}
            </span>
          </div>
        ))}
        {actionsCol && (
          <div className="flex justify-end border-t border-default-100 pt-2">
            {actionsCol.render?.((row as Record<string, unknown>)[actionsCol.key], row, { isCard: true })}
          </div>
        )}
      </div>
    );
  }

  // Mode 'auto' murni CSS (hidden md:block / md:hidden) — kartu di mobile, tabel di desktop,
  // tanpa listener resize (menghindari flash saat hydration). Mode manual menimpa keduanya.
  const tableVisibility = viewMode === 'table' ? 'block' : viewMode === 'card' ? 'hidden' : 'hidden md:block';
  const cardVisibility = viewMode === 'card' ? 'block' : viewMode === 'table' ? 'hidden' : 'block md:hidden';

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          {(title || description) && (
            <div>
              {title && <h3 className="text-md font-medium text-foreground">{title}</h3>}
              {description && <p className="text-sm text-default-500">{description}</p>}
            </div>
          )}

          <div className="flex w-full items-center gap-2 md:w-auto">
            <div className="group relative flex-1 md:w-[300px]">
              <div className="relative flex items-center">
                <Search className="absolute left-3 h-4 w-4 text-default-400" />
                <input
                  type="text"
                  placeholder="Cari..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  // text-base (bukan text-sm) sengaja — di bawah 16px, Safari/Chrome mobile auto-zoom saat fokus.
                  className="w-full rounded-xl border border-default-200 bg-default-50 py-2.5 pl-9 pr-12 text-base text-foreground transition-all focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                {filterFields.length > 0 && (
                  <button
                    ref={filterButtonRef}
                    onClick={() => {
                      setTempFilter(filter);
                      setIsFilterOpen((v) => !v);
                      setIsSettingsOpen(false);
                    }}
                    className={`absolute right-2 rounded-lg p-1.5 transition-all ${
                      isFilterOpen ? 'bg-primary text-white' : 'text-default-400 hover:bg-default-200'
                    }`}
                    title="Filter"
                  >
                    <SlidersHorizontal className="h-4 w-4" />
                  </button>
                )}
              </div>

              <PopoverPortal
                anchorRef={filterButtonRef}
                isOpen={isFilterOpen}
                onClose={() => setIsFilterOpen(false)}
                width={420}
              >
                <div className="rounded-2xl border border-default-200 bg-white p-6 shadow-2xl">
                  <div className="mb-6 flex items-center justify-between">
                    <h4 className="flex items-center gap-2 text-sm font-bold text-foreground">
                      <Filter className="h-4 w-4 text-primary" />
                      Filter
                    </h4>
                    <button onClick={() => setIsFilterOpen(false)} className="text-default-400 hover:text-foreground">
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                    {filterFields.map((field) => (
                      <div key={field.key} className="space-y-2">
                        <label className="px-1 text-[10px] font-bold uppercase text-default-500">
                          {field.label}
                        </label>
                        {field.type === 'text' ? (
                          <input
                            type="text"
                            placeholder={field.placeholder}
                            value={tempFilter[field.key] || ''}
                            onChange={(e) => setTempFilter({ ...tempFilter, [field.key]: e.target.value })}
                            className="w-full rounded-xl border border-default-200 bg-default-50 px-4 py-2 text-base text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                          />
                        ) : field.type === 'async-select' ? (
                          <div className="flex items-center gap-1.5">
                            <AsyncSearchSelect
                              className="flex-1"
                              placeholder={field.placeholder ?? `Cari ${field.label.toLowerCase()}...`}
                              selectedId={tempFilter[field.key] || ''}
                              selectedLabel={asyncLabels[field.key]}
                              onSelect={(id, label) => {
                                setTempFilter({ ...tempFilter, [field.key]: id });
                                setAsyncLabels({ ...asyncLabels, [field.key]: label });
                              }}
                              fetchOptions={field.fetchOptions!}
                            />
                            {tempFilter[field.key] && (
                              <button
                                type="button"
                                onClick={() => {
                                  const next = { ...tempFilter };
                                  delete next[field.key];
                                  setTempFilter(next);
                                }}
                                className="rounded-lg p-2 text-default-400 hover:bg-default-200 hover:text-danger"
                                aria-label={`Hapus filter ${field.label}`}
                              >
                                <X className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        ) : (
                          <Select
                            aria-label={field.label}
                            selectedKeys={[tempFilter[field.key] || '']}
                            onSelectionChange={(keys) =>
                              setTempFilter({ ...tempFilter, [field.key]: (Array.from(keys)[0] as string) ?? '' })
                            }
                            size="sm"
                            className="w-full"
                          >
                            {[
                              <SelectItem key="">{`Semua ${field.label}`}</SelectItem>,
                              ...(field.options ?? []).map((opt) => (
                                <SelectItem key={opt.value}>{opt.label}</SelectItem>
                              )),
                            ]}
                          </Select>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between border-t border-default-200 pt-4">
                    <button
                      onClick={() => {
                        setTempFilter({});
                        setFilter({});
                        setIsFilterOpen(false);
                      }}
                      className="text-xs font-bold uppercase tracking-wider text-danger hover:text-danger-600"
                    >
                      Reset Semua
                    </button>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setIsFilterOpen(false)}
                        className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-default-500 hover:text-foreground"
                      >
                        Batal
                      </button>
                      <button
                        onClick={() => {
                          setFilter(tempFilter);
                          setIsFilterOpen(false);
                        }}
                        className="rounded-xl bg-primary px-6 py-2 text-xs font-bold uppercase tracking-wider text-white shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                      >
                        Terapkan
                      </button>
                    </div>
                  </div>
                </div>
              </PopoverPortal>
            </div>

            <button
              onClick={() => void loadData()}
              disabled={loading}
              className={`rounded-xl border border-default-200 bg-default-50 p-2.5 text-default-500 transition-all hover:bg-default-100 ${loading ? 'opacity-50' : ''}`}
              title="Muat ulang"
            >
              <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <div className="relative flex-shrink-0">
              <button
                ref={settingsButtonRef}
                onClick={() => {
                  setIsSettingsOpen((v) => !v);
                  setIsFilterOpen(false);
                }}
                className={`rounded-xl border p-2.5 transition-all ${
                  isSettingsOpen
                    ? 'border-primary bg-primary text-white'
                    : 'border-default-200 bg-default-50 text-default-500 hover:bg-default-100'
                }`}
                title="Pengaturan tampilan"
              >
                <Settings className="h-4 w-4" />
              </button>

              <PopoverPortal
                anchorRef={settingsButtonRef}
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                width={280}
              >
                <div className="rounded-2xl border border-default-200 bg-white p-6 shadow-2xl">
                  <div className="mb-4 flex items-center justify-between">
                    <h4 className="text-sm font-bold text-foreground">Pengaturan Tampilan</h4>
                    <button onClick={() => setIsSettingsOpen(false)} className="text-default-400 hover:text-foreground">
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="mb-5">
                    <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-default-500">Tampilan Data</p>
                    <div className="grid grid-cols-3 gap-2">
                      {(
                        [
                          { mode: 'auto' as ViewMode, label: 'Otomatis', icon: MonitorSmartphone },
                          { mode: 'table' as ViewMode, label: 'Tabel', icon: Rows3 },
                          { mode: 'card' as ViewMode, label: 'Kartu', icon: LayoutGrid },
                        ]
                      ).map(({ mode, label, icon: Icon }) => (
                        <button
                          key={mode}
                          onClick={() => setViewMode(mode)}
                          className={`flex flex-col items-center justify-center gap-1 rounded-lg py-2 text-xs font-bold transition-all ${
                            viewMode === mode
                              ? 'bg-primary text-white shadow-lg shadow-primary/20'
                              : 'bg-default-100 text-default-500 hover:bg-default-200'
                          }`}
                        >
                          <Icon className="h-3.5 w-3.5" />
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {sortableColumns.length > 0 && (
                    <div className="mb-5">
                      <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-default-500">Urutkan</p>
                      <Select
                        aria-label="Urutkan berdasarkan"
                        selectedKeys={[activeSortKey]}
                        onSelectionChange={(keys) => applySort(Array.from(keys)[0] as string, activeSortDir || 'asc')}
                        size="sm"
                        className="mb-2 w-full"
                      >
                        {sortableColumns.map((c) => (
                          <SelectItem key={c.key}>{c.label}</SelectItem>
                        ))}
                      </Select>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => applySort(activeSortKey, 'asc')}
                          className={`flex items-center justify-center gap-1 rounded-lg py-2 text-xs font-bold transition-all ${
                            activeSortDir === 'asc'
                              ? 'bg-primary text-white shadow-lg shadow-primary/20'
                              : 'bg-default-100 text-default-500 hover:bg-default-200'
                          }`}
                        >
                          <ChevronUp className="h-3 w-3" /> Naik
                        </button>
                        <button
                          onClick={() => applySort(activeSortKey, 'desc')}
                          className={`flex items-center justify-center gap-1 rounded-lg py-2 text-xs font-bold transition-all ${
                            activeSortDir === 'desc'
                              ? 'bg-primary text-white shadow-lg shadow-primary/20'
                              : 'bg-default-100 text-default-500 hover:bg-default-200'
                          }`}
                        >
                          <ChevronDown className="h-3 w-3" /> Turun
                        </button>
                      </div>
                    </div>
                  )}

                  <div>
                    <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-default-500">
                      Baris per halaman
                    </p>
                    <div className="grid grid-cols-4 gap-2">
                      {[10, 20, 50, 100].map((v) => (
                        <button
                          key={v}
                          onClick={() => {
                            setSize(v);
                            setPage(1);
                          }}
                          className={`rounded-lg py-2 text-xs font-bold transition-all ${
                            size === v
                              ? 'bg-primary text-white shadow-lg shadow-primary/20'
                              : 'bg-default-100 text-default-500 hover:bg-default-200'
                          }`}
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </PopoverPortal>
            </div>
          </div>
        </div>

        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 pb-2">
            <span className="mr-2 text-[10px] font-bold uppercase tracking-widest text-default-500">
              Filter aktif:
            </span>

            {search && (
              <div className="flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">
                <span>Cari: {search}</span>
                <button onClick={() => setSearchInput('')} className="rounded-full p-0.5 hover:bg-primary/30">
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}

            {Object.entries(filter).map(([key, value]) => {
              if (!value) return null;
              const field = filterFields.find((f) => f.key === key);
              const displayValue =
                field?.type === 'select'
                  ? field.options?.find((o) => o.value === value)?.label || value
                  : field?.type === 'async-select'
                    ? asyncLabels[key] || value
                    : value;

              return (
                <div
                  key={key}
                  className="flex items-center gap-1.5 rounded-full border border-default-200 bg-default-100 px-3 py-1.5 text-xs font-medium text-foreground"
                >
                  <span className="text-default-500">{field?.label || key}:</span>
                  <span>{displayValue}</span>
                  <button
                    onClick={() => {
                      const next = { ...filter };
                      delete next[key];
                      setFilter(next);
                      if (field?.type === 'async-select') {
                        const nextLabels = { ...asyncLabels };
                        delete nextLabels[key];
                        setAsyncLabels(nextLabels);
                      }
                    }}
                    className="rounded-full p-0.5 hover:bg-default-200"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              );
            })}

            <button
              onClick={clearAllFilters}
              className="ml-2 text-[10px] font-bold uppercase tracking-wider text-danger hover:text-danger-600"
            >
              Hapus Semua
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-pulse text-default-500">Memuat data...</div>
        </div>
      ) : data.length === 0 ? (
        <div className="flex min-h-[240px] flex-col items-center justify-center rounded-xl border border-dashed border-default-200 bg-default-50 p-8 text-center">
          <div className="mb-4 rounded-full border border-default-200 bg-white p-4">
            {emptyState?.icon || <Inbox className="h-8 w-8 text-default-400" />}
          </div>
          <h4 className="mb-1 font-medium text-foreground">{emptyState?.title || 'Data tidak ditemukan'}</h4>
          <p className="max-w-[300px] text-sm text-default-500">
            {hasActiveFilters
              ? 'Tidak ada hasil yang cocok dengan filter saat ini.'
              : emptyState?.description || 'Belum ada data untuk ditampilkan.'}
          </p>
          {hasActiveFilters && (
            <button onClick={clearAllFilters} className="mt-4 text-sm font-medium text-primary hover:underline">
              Hapus semua filter
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col">
          <div className={`${tableVisibility} overflow-x-auto rounded-xl border border-default-200`}>
            <table className="min-w-full divide-y divide-default-200">
              <thead className="bg-default-50">
                <tr>
                  {columns.map((col) => {
                    const [sortKey, sortDir] = sort.split(':');
                    const isSorted = sortKey === col.key;
                    return (
                      <th
                        key={col.key}
                        onClick={() => col.sortable && handleSort(col.key)}
                        style={col.width ? { width: col.width } : undefined}
                        className={`px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-default-500 ${
                          col.sortable ? 'cursor-pointer hover:bg-default-100' : ''
                        }`}
                      >
                        <div className="flex items-center gap-1">
                          {col.label}
                          {col.sortable && (
                            <span className={isSorted ? 'opacity-100' : 'opacity-0'}>
                              {isSorted && sortDir === 'asc' ? (
                                <ChevronUp className="h-3 w-3" />
                              ) : (
                                <ChevronDown className="h-3 w-3" />
                              )}
                            </span>
                          )}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-default-200 bg-white">
                {data.map((row, idx) => (
                  <tr
                    key={rowKey ? rowKey(row) : idx}
                    onClick={() => onRowClick?.(row)}
                    className={onRowClick ? 'cursor-pointer transition-colors hover:bg-default-50' : ''}
                  >
                    {columns.map((col) => (
                      <td key={col.key} style={col.width ? { width: col.width } : undefined} className="whitespace-nowrap px-4 py-3">
                        {col.render ? (
                          col.render((row as Record<string, unknown>)[col.key], row)
                        ) : (
                          <span className="text-sm text-foreground">
                            {String((row as Record<string, unknown>)[col.key] ?? '—')}
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className={`${cardVisibility} flex flex-col gap-3`}>
            {data.map((row, idx) => (
              <div
                key={rowKey ? rowKey(row) : idx}
                onClick={() => onRowClick?.(row)}
                className={onRowClick ? 'cursor-pointer' : ''}
              >
                {renderCard ? renderCard(row) : renderDefaultCard(row)}
              </div>
            ))}
          </div>

          {meta && (
            <div className="mt-2 flex items-center justify-between border-t border-default-200 px-2 py-4">
              <div className="text-sm text-default-500">
                Menampilkan{' '}
                <span className="font-medium text-foreground">
                  {(meta.currentPage - 1) * meta.itemsPerPage + 1}
                </span>{' '}
                –{' '}
                <span className="font-medium text-foreground">
                  {Math.min(meta.currentPage * meta.itemsPerPage, meta.totalItems)}
                </span>{' '}
                dari <span className="font-medium text-foreground">{meta.totalItems}</span> data
              </div>

              {totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={meta.currentPage === 1}
                    className="rounded-xl border border-default-200 bg-default-50 px-4 py-2 text-sm font-medium text-foreground transition-all hover:bg-default-100 disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    Sebelumnya
                  </button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map((pageNum) => (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`h-9 w-9 rounded-xl text-sm font-medium transition-all ${
                          meta.currentPage === pageNum
                            ? 'bg-primary text-white shadow-lg shadow-primary/20'
                            : 'bg-default-50 text-default-500 hover:bg-default-100'
                        }`}
                      >
                        {pageNum}
                      </button>
                    ))}
                    {totalPages > 5 && <span className="px-2 text-default-400">...</span>}
                  </div>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={meta.currentPage === totalPages}
                    className="rounded-xl border border-default-200 bg-default-50 px-4 py-2 text-sm font-medium text-foreground transition-all hover:bg-default-100 disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    Berikutnya
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
