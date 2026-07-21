'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button, Select, SelectItem } from '@heroui/react';
import { PackagePlus } from 'lucide-react';

import { AppModal } from '../../../../../components/app-modal';
import { DataGrid, type GridColumn } from '../../../../../components/data-grid';
import { LoadingSpinner } from '../../../../../components/loading-spinner';
import { NoBusinessState } from '../../../../../components/no-business-state';
import { NumberInput } from '../../../../../components/number-input';
import { ProductSearchSelect } from '../../../../../components/product-search-select';
import { StickyHeader } from '../../../../../components/sticky-header';
import { type PagedFetchResult } from '../../../../../components/async-search-select';
import { apiClient, ApiError, buildGridQueryString } from '../../../../../lib/api-client';
import { useBusinessContext } from '../../../../../context/business-context';
import { hasMinRole, type GridResult, type PosProduct, type PosRack, type PosRackProduct } from '../../../../../lib/types';

export default function RackProductsPage() {
  const params = useParams<{ locationId: string; rackId: string }>();
  const { businessId, role, loading: businessLoading } = useBusinessContext();

  const [rack, setRack] = useState<PosRack | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const [assignOpen, setAssignOpen] = useState(false);
  const [assignProduct, setAssignProduct] = useState<{ id: string; label: string } | null>(null);
  const [assignQty, setAssignQty] = useState('');
  const [assignSaving, setAssignSaving] = useState(false);
  const [assignError, setAssignError] = useState<string | null>(null);

  const [moveRow, setMoveRow] = useState<PosRackProduct | null>(null);
  const [otherRacks, setOtherRacks] = useState<PosRack[]>([]);
  const [moveTargetId, setMoveTargetId] = useState('');
  const [moveQty, setMoveQty] = useState('');
  const [moveSaving, setMoveSaving] = useState(false);
  const [moveError, setMoveError] = useState<string | null>(null);

  const canEdit = hasMinRole(role ?? '', 'manager');

  useEffect(() => {
    if (!businessId || !params.rackId) return;
    apiClient<GridResult<PosRack>>(`/api/businesses/${businessId}/locations/${params.locationId}/racks?size=200`)
      .then((res) => setRack(res.data.find((r) => r.id === params.rackId) ?? null));
  }, [businessId, params.locationId, params.rackId, refreshTrigger]);

  const fetchData = useCallback(
    async (gridParams: { page: number; size: number; search: string; filter: Record<string, string>; sort: string }) => {
      const qs = buildGridQueryString(gridParams);
      return apiClient<GridResult<PosRackProduct>>(`/api/businesses/${businessId}/racks/${params.rackId}/products?${qs}`);
    },
    [businessId, params.rackId],
  );

  const fetchProductOptions = useCallback(
    async (search: string, page: number): Promise<PagedFetchResult> => {
      if (!businessId) return { items: [], hasMore: false };
      const res = await apiClient<GridResult<PosProduct>>(
        `/api/businesses/${businessId}/products?search=${encodeURIComponent(search)}&size=10&page=${page}`,
      );
      return {
        items: res.data.map((p) => ({ id: p.id, label: `${p.name} (${p.sku})`, raw: p })),
        hasMore: res.meta.currentPage < res.meta.totalPages,
      };
    },
    [businessId],
  );

  function openAssign() {
    setAssignProduct(null);
    setAssignQty('');
    setAssignError(null);
    setAssignOpen(true);
  }

  async function handleAssign() {
    if (!businessId || !assignProduct || !assignQty) return;
    setAssignSaving(true);
    setAssignError(null);
    try {
      await apiClient(`/api/businesses/${businessId}/racks/${params.rackId}/products`, {
        method: 'POST',
        body: JSON.stringify({ product_id: assignProduct.id, qty: Number(assignQty) }),
      });
      setAssignOpen(false);
      setRefreshTrigger((t) => t + 1);
    } catch (err) {
      setAssignError(err instanceof ApiError ? err.message : 'Gagal assign produk');
    } finally {
      setAssignSaving(false);
    }
  }

  async function handleUnassign(row: PosRackProduct) {
    if (!businessId) return;
    if (!confirm(`Lepas "${row.product?.name ?? row.product_id}" dari rak ini?`)) return;
    try {
      await apiClient(`/api/businesses/${businessId}/racks/${params.rackId}/products/${row.product_id}`, {
        method: 'DELETE',
      });
      setRefreshTrigger((t) => t + 1);
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Gagal melepas produk');
    }
  }

  async function openMove(row: PosRackProduct) {
    if (!businessId || !rack) return;
    setMoveRow(row);
    setMoveQty('');
    setMoveTargetId('');
    setMoveError(null);
    const res = await apiClient<GridResult<PosRack>>(
      `/api/businesses/${businessId}/locations/${rack.location_id}/racks?size=200`,
    );
    setOtherRacks(res.data.filter((r) => r.id !== rack.id));
  }

  async function handleMove() {
    if (!businessId || !moveRow || !moveTargetId || !moveQty) return;
    setMoveSaving(true);
    setMoveError(null);
    try {
      await apiClient(`/api/businesses/${businessId}/racks/${params.rackId}/move`, {
        method: 'POST',
        body: JSON.stringify({ product_id: moveRow.product_id, qty: Number(moveQty), target_rack_id: moveTargetId }),
      });
      setMoveRow(null);
      setRefreshTrigger((t) => t + 1);
    } catch (err) {
      setMoveError(err instanceof ApiError ? err.message : 'Gagal memindahkan produk');
    } finally {
      setMoveSaving(false);
    }
  }

  if (businessLoading) return <LoadingSpinner />;
  if (!businessId) return <NoBusinessState />;

  const columns: GridColumn<PosRackProduct>[] = [
    { key: 'product', label: 'Produk', render: (_v, row) => row.product?.name ?? row.product_id },
    { key: 'sku', label: 'SKU', render: (_v, row) => row.product?.sku ?? '—' },
    { key: 'qty', label: 'Qty', sortable: true },
    ...(canEdit
      ? [
          {
            key: 'actions',
            label: 'Aksi',
            render: (_: unknown, row: PosRackProduct) => (
              <div className="flex gap-2">
                <Button size="sm" variant="flat" onPress={() => openMove(row)}>
                  Pindah
                </Button>
                <Button size="sm" variant="flat" color="danger" onPress={() => handleUnassign(row)}>
                  Lepas
                </Button>
              </div>
            ),
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-4">
      <StickyHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Button as={Link} href={`/dashboard/locations/${params.locationId}/racks`} variant="light" size="sm" className="mb-2">
              ← Kembali ke Rak
            </Button>
            <h1 className="text-2xl font-bold text-foreground">Rak {rack?.code ?? '...'}{rack?.name ? ` — ${rack.name}` : ''}</h1>
            <p className="text-sm text-default-500">Produk yang dialokasikan ke rak ini.</p>
          </div>
          {canEdit && (
            <Button color="primary" onPress={openAssign} className="w-full sm:w-auto">
              + Assign Produk
            </Button>
          )}
        </div>
      </StickyHeader>

      <DataGrid<PosRackProduct>
        columns={columns}
        fetchData={fetchData}
        defaultSort="updated_at:desc"
        refreshTrigger={refreshTrigger}
        rowKey={(row) => row.id}
        emptyState={{
          title: 'Belum ada produk di rak ini',
          description: 'Assign produk pertama ke rak ini.',
          icon: <PackagePlus className="h-8 w-8 text-default-400" />,
        }}
      />

      <AppModal
        isOpen={assignOpen}
        onClose={() => setAssignOpen(false)}
        title="Assign Produk ke Rak"
        footer={
          <>
            <Button variant="flat" onPress={() => setAssignOpen(false)}>
              Batal
            </Button>
            <Button color="primary" isLoading={assignSaving} onPress={handleAssign}>
              Simpan
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <ProductSearchSelect
            label="Produk"
            selectedId={assignProduct?.id ?? ''}
            selectedLabel={assignProduct?.label}
            onSelect={(id, label) => setAssignProduct({ id, label })}
            fetchOptions={fetchProductOptions}
          />
          <NumberInput label="Qty" value={assignQty} onValueChange={setAssignQty} />
          {assignError && <p className="text-sm text-danger">{assignError}</p>}
        </div>
      </AppModal>

      <AppModal
        isOpen={!!moveRow}
        onClose={() => setMoveRow(null)}
        title={`Pindahkan ${moveRow?.product?.name ?? ''}`}
        footer={
          <>
            <Button variant="flat" onPress={() => setMoveRow(null)}>
              Batal
            </Button>
            <Button color="primary" isLoading={moveSaving} onPress={handleMove}>
              Pindahkan
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Select
            label="Rak Tujuan"
            selectedKeys={moveTargetId ? [moveTargetId] : []}
            onSelectionChange={(keys) => setMoveTargetId((Array.from(keys)[0] as string) ?? '')}
          >
            {otherRacks.map((r) => (
              <SelectItem key={r.id}>{r.code}{r.name ? ` — ${r.name}` : ''}</SelectItem>
            ))}
          </Select>
          <NumberInput label={`Qty (tersedia: ${moveRow?.qty ?? 0})`} value={moveQty} onValueChange={setMoveQty} />
          {moveError && <p className="text-sm text-danger">{moveError}</p>}
        </div>
      </AppModal>
    </div>
  );
}
