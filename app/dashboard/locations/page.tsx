'use client';

import { useCallback, useState } from 'react';
import { Button, Chip, Input, Select, SelectItem, Switch, Textarea } from '@heroui/react';
import { MapPin } from 'lucide-react';

import { AppModal } from '../../components/app-modal';
import { DataGrid, type GridColumn } from '../../components/data-grid';
import { LoadingSpinner } from '../../components/loading-spinner';
import { NoBusinessState } from '../../components/no-business-state';
import { useNewShortcut } from '../../hooks/use-new-shortcut';
import { apiClient, ApiError, buildGridQueryString } from '../../lib/api-client';
import { useBusinessContext } from '../../context/business-context';
import { hasMinRole, LOCATION_TYPE_LABELS, type GridResult, type PosLocation } from '../../lib/types';

const EMPTY_FORM = { name: '', type: 'store', address: '', is_active: true };

export default function LocationsPage() {
  const { businessId, role, loading: businessLoading } = useBusinessContext();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<PosLocation | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const canEdit = hasMinRole(role ?? '', 'manager');
  const canDelete = hasMinRole(role ?? '', 'owner');

  const fetchData = useCallback(
    async (params: { page: number; size: number; search: string; filter: Record<string, string>; sort: string }) => {
      const qs = buildGridQueryString(params);
      return apiClient<GridResult<PosLocation>>(`/api/businesses/${businessId}/locations?${qs}`);
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

  function openEdit(loc: PosLocation) {
    setEditing(loc);
    setForm({ name: loc.name, type: loc.type, address: loc.address ?? '', is_active: loc.is_active });
    setError(null);
    setModalOpen(true);
  }

  async function handleSave() {
    if (!businessId || !form.name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      if (editing) {
        await apiClient(`/api/businesses/${businessId}/locations/${editing.id}`, {
          method: 'PATCH',
          body: JSON.stringify(form),
        });
      } else {
        await apiClient(`/api/businesses/${businessId}/locations`, {
          method: 'POST',
          body: JSON.stringify(form),
        });
      }
      setModalOpen(false);
      setRefreshTrigger((t) => t + 1);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal menyimpan lokasi');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(loc: PosLocation) {
    if (!businessId) return;
    if (!confirm(`Hapus lokasi "${loc.name}"?`)) return;
    try {
      await apiClient(`/api/businesses/${businessId}/locations/${loc.id}`, { method: 'DELETE' });
      setRefreshTrigger((t) => t + 1);
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Gagal menghapus lokasi');
    }
  }

  if (businessLoading) return <LoadingSpinner />;
  if (!businessId) return <NoBusinessState />;

  const columns: GridColumn<PosLocation>[] = [
    { key: 'name', label: 'Nama', sortable: true },
    { key: 'type', label: 'Tipe', sortable: true, render: (v) => LOCATION_TYPE_LABELS[v] ?? v },
    { key: 'address', label: 'Alamat', render: (v) => v ?? '—' },
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
    ...(canEdit
      ? [
          {
            key: 'actions',
            label: 'Aksi',
            render: (_: unknown, row: PosLocation) => (
              <div className="flex gap-2">
                <Button size="sm" variant="flat" onPress={() => openEdit(row)}>
                  Edit
                </Button>
                {canDelete && (
                  <Button size="sm" variant="flat" color="danger" onPress={() => handleDelete(row)}>
                    Hapus
                  </Button>
                )}
              </div>
            ),
          },
        ]
      : []),
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Lokasi</h1>
          <p className="text-sm text-default-500">Cabang toko & gudang milik bisnis ini.</p>
        </div>
        {canEdit && (
          <Button color="primary" onPress={openCreate}>
            + Tambah Lokasi
          </Button>
        )}
      </div>

      <DataGrid<PosLocation>
        columns={columns}
        fetchData={fetchData}
        filterFields={[
          {
            key: 'type',
            label: 'Tipe',
            type: 'select',
            options: Object.entries(LOCATION_TYPE_LABELS).map(([value, label]) => ({ label, value })),
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
        emptyState={{ title: 'Belum ada lokasi', description: 'Tambah cabang toko atau gudang pertama.', icon: <MapPin className="h-8 w-8 text-default-400" /> }}
      />

      <AppModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Lokasi' : 'Tambah Lokasi'}
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
            label="Nama Lokasi"
            value={form.name}
            onValueChange={(v) => setForm((f) => ({ ...f, name: v.toUpperCase() }))}
            isRequired
          />
          <Select
            label="Tipe"
            selectedKeys={[form.type]}
            onSelectionChange={(keys) => setForm((f) => ({ ...f, type: Array.from(keys)[0] as string }))}
          >
            {Object.entries(LOCATION_TYPE_LABELS).map(([value, label]) => (
              <SelectItem key={value}>{label}</SelectItem>
            ))}
          </Select>
          <Textarea
            label="Alamat (opsional)"
            value={form.address}
            onValueChange={(v) => setForm((f) => ({ ...f, address: v }))}
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
