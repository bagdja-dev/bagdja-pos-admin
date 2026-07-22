'use client';

import { useCallback, useState } from 'react';
import dynamic from 'next/dynamic';
import { Button, Chip, Input, Switch, Tooltip } from '@heroui/react';
import { Package, Pencil, ScanBarcode, Trash2 } from 'lucide-react';

import { AppModal } from '../../components/app-modal';
import { CurrencyInput } from '../../components/currency-input';
import { DataGrid, type GridColumn } from '../../components/data-grid';
import { NoBusinessState } from '../../components/no-business-state';
import { NumberInput } from '../../components/number-input';
import { LoadingSpinner } from '../../components/loading-spinner';
import { PrintLabelButton } from '../../components/print-label-button';
import { StickyHeader } from '../../components/sticky-header';
import { TagInput } from '../../components/tag-input';
import { useNewShortcut } from '../../hooks/use-new-shortcut';
import { apiClient, ApiError, buildGridQueryString } from '../../lib/api-client';
import { formatCurrency as formatMoney } from '../../lib/currency';
import { useBusinessContext } from '../../context/business-context';
import { hasMinRole, type GridResult, type PosProduct } from '../../lib/types';

const EMPTY_FORM = {
  sku: '',
  name: '',
  purchase_price: '0',
  sale_price: '0',
  min_stock: '0',
  tags: [] as string[],
  is_active: true,
};

const BarcodeScannerModal = dynamic(
  () => import('../../components/barcode-scanner-modal').then((m) => m.BarcodeScannerModal),
  { ssr: false },
);

export default function ProductsPage() {
  const { businessId, activeMembership, role, loading: businessLoading } = useBusinessContext();
  function formatCurrency(value: number | string) {
    return formatMoney(value, activeMembership?.business.currency, activeMembership?.business.locale);
  }
  const [modalOpen, setModalOpen] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [editing, setEditing] = useState<PosProduct | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const canEdit = hasMinRole(role ?? '', 'manager');

  const fetchData = useCallback(
    async (params: { page: number; size: number; search: string; filter: Record<string, string>; sort: string }) => {
      const qs = buildGridQueryString(params);
      return apiClient<GridResult<PosProduct>>(`/api/businesses/${businessId}/products?${qs}`);
    },
    [businessId],
  );

  useNewShortcut(openCreate, canEdit && !modalOpen);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setError(null);
    setModalOpen(true);
  }

  function openEdit(p: PosProduct) {
    setEditing(p);
    setForm({
      sku: p.sku,
      name: p.name,
      purchase_price: p.purchase_price,
      sale_price: p.sale_price,
      min_stock: String(p.min_stock),
      tags: p.tags ?? [],
      is_active: p.is_active,
    });
    setError(null);
    setModalOpen(true);
  }

  function handleScanSku(value: string) {
    setForm((f) => ({ ...f, sku: value }));
    setScannerOpen(false);
  }

  async function handleSave() {
    if (!businessId || !form.sku.trim() || !form.name.trim()) return;
    setSaving(true);
    setError(null);
    const payload = {
      sku: form.sku,
      name: form.name,
      purchase_price: Number(form.purchase_price) || 0,
      sale_price: Number(form.sale_price) || 0,
      min_stock: Number(form.min_stock) || 0,
      tags: form.tags,
      is_active: form.is_active,
    };
    try {
      if (editing) {
        await apiClient(`/api/businesses/${businessId}/products/${editing.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
      } else {
        await apiClient(`/api/businesses/${businessId}/products`, {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }
      setModalOpen(false);
      setRefreshTrigger((t) => t + 1);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal menyimpan produk');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(p: PosProduct) {
    if (!businessId) return;
    if (!confirm(`Hapus produk "${p.name}"?`)) return;
    try {
      await apiClient(`/api/businesses/${businessId}/products/${p.id}`, { method: 'DELETE' });
      setRefreshTrigger((t) => t + 1);
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Gagal menghapus produk');
    }
  }

  if (businessLoading) return <LoadingSpinner />;
  if (!businessId) return <NoBusinessState />;

  const columns: GridColumn<PosProduct>[] = [
    {
      key: 'actions',
      label: 'Aksi',
      width: '110px',
      render: (_: unknown, row: PosProduct) => (
        <div className="flex gap-1">
          <PrintLabelButton product={row} />
          {canEdit && (
            <>
              <Tooltip content="Edit">
                <Button size="sm" variant="flat" isIconOnly onPress={() => openEdit(row)} aria-label="Edit">
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
              </Tooltip>
              <Tooltip content="Hapus">
                <Button
                  size="sm"
                  variant="flat"
                  color="danger"
                  isIconOnly
                  onPress={() => handleDelete(row)}
                  aria-label="Hapus"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </Tooltip>
            </>
          )}
        </div>
      ),
    },
    { key: 'sku', label: 'SKU', sortable: true },
    { key: 'name', label: 'Nama', sortable: true },
    {
      key: 'purchase_price',
      label: 'Harga Beli',
      sortable: true,
      render: (v) => formatCurrency(v),
    },
    {
      key: 'sale_price',
      label: 'Harga Jual',
      sortable: true,
      render: (v) => formatCurrency(v),
    },
    {
      key: 'current_stock',
      label: 'Stok Saat Ini',
      sortable: true,
      render: (_: unknown, row: PosProduct) => (
        <span className={row.current_stock <= row.min_stock ? 'font-medium text-danger' : ''}>
          {row.current_stock}
        </span>
      ),
    },
    { key: 'min_stock', label: 'Stok Min', sortable: true },
    {
      key: 'tags',
      label: 'Tag',
      width: '30%',
      render: (v: string[], _row, context) =>
        v && v.length > 0 ? (
          <div className={`flex gap-1 ${context?.isCard ? 'flex-wrap justify-end' : ''}`}>
            {v.map((tag) => (
              <Chip key={tag} size="sm" variant="flat">
                {tag}
              </Chip>
            ))}
          </div>
        ) : (
          '—'
        ),
    },
    {
      key: 'is_active',
      label: 'Status',
      render: (v) => (
        <Chip size="sm" color={v ? 'success' : 'default'} variant="flat">
          {v ? 'Aktif' : 'Nonaktif'}
        </Chip>
      ),
    },

  ];

  return (
    <div className="space-y-4">
      <StickyHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Produk</h1>
            <p className="text-sm text-default-500">Master katalog produk (harga beli/jual, stok minimum).</p>
          </div>
          {canEdit && (
            <Button color="primary" onPress={openCreate} className="w-full sm:w-auto">
              + Tambah Produk
            </Button>
          )}
        </div>
      </StickyHeader>

      <DataGrid<PosProduct>
        columns={columns}
        fetchData={fetchData}
        filterFields={[
          {
            key: 'tags',
            label: 'Tag',
            type: 'text',
            placeholder: 'mis. kijang',
          },
          {
            key: 'is_active',
            label: 'Status',
            type: 'select',
            options: [
              { label: 'Aktif', value: 'true' },
              { label: 'Nonaktif', value: 'false' },
            ],
          },
        ]}
        defaultSort="name:asc"
        refreshTrigger={refreshTrigger}
        rowKey={(row) => row.id}
        emptyState={{ title: 'Belum ada produk', description: 'Tambah produk pertama untuk mulai jualan.', icon: <Package className="h-8 w-8 text-default-400" /> }}
      />

      <AppModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Produk' : 'Tambah Produk'}
        footer={
          <>
            <Button variant="flat" onPress={() => setModalOpen(false)}>
              Batal
            </Button>
            <Button color="primary" isLoading={saving} onPress={handleSave}>
              Simpan
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="flex items-end gap-2">
            <Input
              label="SKU"
              value={form.sku}
              onValueChange={(v) => setForm((f) => ({ ...f, sku: v }))}
              isRequired
              className="flex-1"
            />
            <Button isIconOnly variant="flat" onPress={() => setScannerOpen(true)} aria-label="Scan barcode/QR SKU">
              <ScanBarcode className="h-4 w-4" />
            </Button>
          </div>
          <Input
            label="Nama Produk"
            value={form.name}
            onValueChange={(v) => setForm((f) => ({ ...f, name: v }))}
            isRequired
          />
          <CurrencyInput
            label="Harga Beli"
            value={form.purchase_price}
            onValueChange={(v) => setForm((f) => ({ ...f, purchase_price: v }))}
          />
          <CurrencyInput
            label="Harga Jual"
            value={form.sale_price}
            onValueChange={(v) => setForm((f) => ({ ...f, sale_price: v }))}
          />
          <NumberInput
            label="Stok Minimum"
            value={form.min_stock}
            onValueChange={(v) => setForm((f) => ({ ...f, min_stock: v }))}
          />
          <TagInput
            label="Tag (nama umum/kendaraan yang cocok, opsional)"
            value={form.tags}
            onChange={(tags) => setForm((f) => ({ ...f, tags }))}
            placeholder="mis. BUSI CARRY, lalu Enter"
          />
          <Switch isSelected={form.is_active} onValueChange={(v) => setForm((f) => ({ ...f, is_active: v }))}>
            Aktif
          </Switch>
          {error && <p className="text-sm text-danger">{error}</p>}
        </div>
      </AppModal>

      {scannerOpen && (
        <BarcodeScannerModal isOpen={scannerOpen} onClose={() => setScannerOpen(false)} onScan={handleScanSku} />
      )}
    </div>
  );
}
