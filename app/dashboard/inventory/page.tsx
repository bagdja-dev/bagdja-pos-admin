'use client';

import { useCallback, useEffect, useState } from 'react';
import { Chip, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from '@heroui/react';
import { PackageSearch } from 'lucide-react';

import { type PagedFetchResult } from '../../components/async-search-select';
import { LoadingSpinner } from '../../components/loading-spinner';
import { ProductSearchSelect } from '../../components/product-search-select';
import { NoBusinessState } from '../../components/no-business-state';
import { StickyHeader } from '../../components/sticky-header';
import { apiClient, ApiError } from '../../lib/api-client';
import { useBusinessContext } from '../../context/business-context';
import {
  LOCATION_TYPE_LABELS,
  type GridResult,
  type PosProduct,
  type ProductStockDistribution,
  type RackForProduct,
} from '../../lib/types';

interface SelectedProduct {
  id: string;
  label: string;
  minStock: number;
}

export default function InventoryDashboardPage() {
  const { businessId, loading: businessLoading } = useBusinessContext();

  const [selectedProduct, setSelectedProduct] = useState<SelectedProduct | null>(null);
  const [distribution, setDistribution] = useState<ProductStockDistribution | null>(null);
  const [loadingDistribution, setLoadingDistribution] = useState(false);
  const [racks, setRacks] = useState<RackForProduct[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchProductOptions = useCallback(
    async (search: string, page: number): Promise<PagedFetchResult> => {
      if (!businessId) return { items: [], hasMore: false };
      const res = await apiClient<GridResult<PosProduct>>(
        `/api/businesses/${businessId}/products?search=${encodeURIComponent(search)}&size=10&page=${page}`,
      );
      return {
        items: res.data.map((p) => ({
          id: p.id,
          label: `${p.name} (${p.sku})`,
          description: p.tags?.length ? p.tags.join(', ') : undefined,
          raw: p,
        })),
        hasMore: res.meta.currentPage < res.meta.totalPages,
      };
    },
    [businessId],
  );

  useEffect(() => {
    if (!businessId || !selectedProduct) {
      setDistribution(null);
      setRacks(null);
      return;
    }
    setLoadingDistribution(true);
    setError(null);
    apiClient<ProductStockDistribution>(`/api/businesses/${businessId}/products/${selectedProduct.id}/inventory`)
      .then(setDistribution)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Gagal memuat sebaran stok'))
      .finally(() => setLoadingDistribution(false));
    apiClient<RackForProduct[]>(`/api/businesses/${businessId}/products/${selectedProduct.id}/racks`)
      .then(setRacks)
      .catch(() => setRacks([]));
  }, [businessId, selectedProduct]);

  if (businessLoading) return <LoadingSpinner />;
  if (!businessId) return <NoBusinessState />;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <StickyHeader>
        <h1 className="text-2xl font-bold text-foreground">Dashboard Stok</h1>
        <p className="text-sm text-default-500">Cari satu produk untuk lihat sebaran stoknya di semua lokasi.</p>
      </StickyHeader>

      <ProductSearchSelect
        label="Produk"
        placeholder="Cari nama, SKU, atau tag..."
        selectedId={selectedProduct?.id ?? ''}
        selectedLabel={selectedProduct?.label}
        onSelect={(id, label, raw) => {
          if (!id) {
            setSelectedProduct(null);
            return;
          }
          const product = raw as PosProduct | undefined;
          setSelectedProduct({ id, label, minStock: product?.min_stock ?? 0 });
        }}
        fetchOptions={fetchProductOptions}
      />

      {error && <p className="text-sm text-danger">{error}</p>}

      {loadingDistribution ? (
        <LoadingSpinner />
      ) : selectedProduct && distribution ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-2xl border border-default-200 bg-default-50 px-5 py-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-default-500">Total Stok Semua Lokasi</p>
              <p className="text-2xl font-bold text-foreground">{distribution.total}</p>
            </div>
            {selectedProduct.minStock > 0 && (
              <p className="text-xs text-default-500">Stok minimum: {selectedProduct.minStock} / lokasi</p>
            )}
          </div>

          <Table aria-label="Sebaran stok per lokasi">
            <TableHeader>
              <TableColumn>LOKASI</TableColumn>
              <TableColumn>TIPE</TableColumn>
              <TableColumn>STOK</TableColumn>
            </TableHeader>
            <TableBody emptyContent="Bisnis ini belum punya lokasi">
              {distribution.rows.map((row) => {
                const isLow = selectedProduct.minStock > 0 && row.quantity < selectedProduct.minStock;
                return (
                  <TableRow key={row.location_id}>
                    <TableCell>{row.location_name}</TableCell>
                    <TableCell>{LOCATION_TYPE_LABELS[row.location_type] ?? row.location_type}</TableCell>
                    <TableCell>
                      <Chip size="sm" color={isLow ? 'danger' : 'default'} variant={isLow ? 'flat' : 'light'}>
                        {row.quantity}
                      </Chip>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-default-500">Rak</p>
            {racks && racks.length > 0 ? (
              <Table aria-label="Sebaran rak">
                <TableHeader>
                  <TableColumn>LOKASI</TableColumn>
                  <TableColumn>RAK</TableColumn>
                  <TableColumn>QTY</TableColumn>
                </TableHeader>
                <TableBody>
                  {racks.map((r) => (
                    <TableRow key={r.rackId}>
                      <TableCell>{r.locationName}</TableCell>
                      <TableCell>{r.rackCode}{r.rackName ? ` — ${r.rackName}` : ''}</TableCell>
                      <TableCell>{r.qty}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm text-default-500">Belum dialokasikan ke rak manapun.</p>
            )}
          </div>
        </div>
      ) : (
        <div className="flex min-h-[200px] flex-col items-center justify-center rounded-xl border border-dashed border-default-200 bg-default-50 p-8 text-center">
          <PackageSearch className="mb-3 h-8 w-8 text-default-400" />
          <p className="text-sm text-default-500">Cari produk di atas untuk lihat sebaran stoknya.</p>
        </div>
      )}
    </div>
  );
}
