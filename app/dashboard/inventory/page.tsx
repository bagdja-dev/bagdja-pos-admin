'use client';

import { useCallback, useEffect, useState } from 'react';
import { Chip, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from '@heroui/react';
import { PackageSearch } from 'lucide-react';
import { useTranslations } from 'next-intl';

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
  const t = useTranslations('inventory');

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
      .catch((err) => setError(err instanceof ApiError ? err.message : t('loadError')))
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
        <h1 className="text-2xl font-bold text-foreground">{t('title')}</h1>
        <p className="text-sm text-default-500">{t('subtitle')}</p>
      </StickyHeader>

      <ProductSearchSelect
        label={t('productLabel')}
        placeholder={t('productPlaceholder')}
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
              <p className="text-[10px] font-bold uppercase tracking-wider text-default-500">{t('totalAllLocations')}</p>
              <p className="text-2xl font-bold text-foreground">{distribution.total}</p>
            </div>
            {selectedProduct.minStock > 0 && (
              <p className="text-xs text-default-500">{t('minStock', { min: selectedProduct.minStock })}</p>
            )}
          </div>

          <Table aria-label="Sebaran stok per lokasi">
            <TableHeader>
              <TableColumn>{t('colLocation')}</TableColumn>
              <TableColumn>{t('colType')}</TableColumn>
              <TableColumn>{t('colStock')}</TableColumn>
            </TableHeader>
            <TableBody emptyContent={t('noLocations')}>
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
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-default-500">{t('rack')}</p>
            {racks && racks.length > 0 ? (
              <Table aria-label="Sebaran rak">
                <TableHeader>
                  <TableColumn>{t('colLocation')}</TableColumn>
                  <TableColumn>{t('colRack')}</TableColumn>
                  <TableColumn>{t('colQty')}</TableColumn>
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
              <p className="text-sm text-default-500">{t('noRacks')}</p>
            )}
          </div>
        </div>
      ) : (
        <div className="flex min-h-[200px] flex-col items-center justify-center rounded-xl border border-dashed border-default-200 bg-default-50 p-8 text-center">
          <PackageSearch className="mb-3 h-8 w-8 text-default-400" />
          <p className="text-sm text-default-500">{t('emptyHint')}</p>
        </div>
      )}
    </div>
  );
}
