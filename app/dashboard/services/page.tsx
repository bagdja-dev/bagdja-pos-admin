'use client';

import { useCallback, useState } from 'react';
import { Button, Chip, Input, Switch } from '@heroui/react';
import { Wrench } from 'lucide-react';

import { AppModal } from '../../components/app-modal';
import { CurrencyInput } from '../../components/currency-input';
import { DataGrid, type GridColumn } from '../../components/data-grid';
import { LoadingSpinner } from '../../components/loading-spinner';
import { NoBusinessState } from '../../components/no-business-state';
import { StickyHeader } from '../../components/sticky-header';
import { useNewShortcut } from '../../hooks/use-new-shortcut';
import { apiClient, ApiError, buildGridQueryString } from '../../lib/api-client';
import { formatCurrency as formatMoney } from '../../lib/currency';
import { useBusinessContext } from '../../context/business-context';
import { hasMinRole, type GridResult, type ServiceItem } from '../../lib/types';

const EMPTY_FORM = { name: '', default_price: '0', is_active: true };

export default function ServicesPage() {
  const { businessId, activeMembership, role, loading: businessLoading } = useBusinessContext();
  function formatCurrency(value: number | string) {
    return formatMoney(value, activeMembership?.business.currency, activeMembership?.business.locale);
  }
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ServiceItem | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const canEdit = hasMinRole(role ?? '', 'manager');

  const fetchData = useCallback(
    async (params: { page: number; size: number; search: string; filter: Record<string, string>; sort: string }) => {
      const qs = buildGridQueryString(params);
      return apiClient<GridResult<ServiceItem>>(`/api/businesses/${businessId}/services?${qs}`);
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

  function openEdit(s: ServiceItem) {
    setEditing(s);
    setForm({ name: s.name, default_price: s.default_price, is_active: s.is_active });
    setError(null);
    setModalOpen(true);
  }

  async function handleSave() {
    if (!businessId || !form.name.trim()) return;
    setSaving(true);
    setError(null);
    const payload = {
      name: form.name,
      default_price: Number(form.default_price) || 0,
      is_active: form.is_active,
    };
    try {
      if (editing) {
        await apiClient(`/api/businesses/${businessId}/services/${editing.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
      } else {
        await apiClient(`/api/businesses/${businessId}/services`, {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }
      setModalOpen(false);
      setRefreshTrigger((t) => t + 1);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal menyimpan jasa');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(s: ServiceItem) {
    if (!businessId) return;
    if (!confirm(`Hapus jasa "${s.name}"?`)) return;
    try {
      await apiClient(`/api/businesses/${businessId}/services/${s.id}`, { method: 'DELETE' });
      setRefreshTrigger((t) => t + 1);
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Gagal menghapus jasa');
    }
  }

  if (businessLoading) return <LoadingSpinner />;
  if (!businessId) return <NoBusinessState />;

  const columns: GridColumn<ServiceItem>[] = [
    ...(canEdit
      ? [
        {
          key: 'actions',
          label: 'Aksi',
          width: '120px',
          render: (_: unknown, row: ServiceItem) => (
            <div className="flex gap-2">
              <Button size="sm" variant="flat" onPress={() => openEdit(row)}>
                Edit
              </Button>
              <Button size="sm" variant="flat" color="danger" onPress={() => handleDelete(row)}>
                Hapus
              </Button>
            </div>
          ),
        },
      ]
      : []),
    { key: 'name', label: 'Nama', sortable: true },
    { key: 'default_price', label: 'Harga Default', sortable: true, render: (v) => formatCurrency(v) },
    {
      key: 'is_active',
      label: 'Status',
      sortable: true,
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
            <h1 className="text-2xl font-bold text-foreground">Jasa / Layanan</h1>
            <p className="text-sm text-default-500">Master ongkos jasa (mis. Ongkos Pasang Ban).</p>
          </div>
          {canEdit && (
            <Button color="primary" onPress={openCreate} className="w-full sm:w-auto">
              + Tambah Jasa
            </Button>
          )}
        </div>
      </StickyHeader>

      <DataGrid<ServiceItem>
        columns={columns}
        fetchData={fetchData}
        filterFields={[
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
        emptyState={{ title: 'Belum ada jasa', description: 'Tambah jasa/layanan pertama.', icon: <Wrench className="h-8 w-8 text-default-400" /> }}
      />

      <AppModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Jasa' : 'Tambah Jasa'}
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
          <Input
            label="Nama Jasa"
            value={form.name}
            onValueChange={(v) => setForm((f) => ({ ...f, name: v.toUpperCase() }))}
            isRequired
          />
          <CurrencyInput
            label="Harga Default"
            value={form.default_price}
            onValueChange={(v) => setForm((f) => ({ ...f, default_price: v }))}
          />
          <Switch isSelected={form.is_active} onValueChange={(v) => setForm((f) => ({ ...f, is_active: v }))}>
            Aktif
          </Switch>
          {error && <p className="text-sm text-danger">{error}</p>}
        </div>
      </AppModal>
    </div>
  );
}
