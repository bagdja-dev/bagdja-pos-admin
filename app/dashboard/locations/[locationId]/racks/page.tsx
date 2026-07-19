'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button, Chip, Input, Switch } from '@heroui/react';
import { Archive } from 'lucide-react';

import { AppModal } from '../../../../components/app-modal';
import { DataGrid, type GridColumn } from '../../../../components/data-grid';
import { LoadingSpinner } from '../../../../components/loading-spinner';
import { NoBusinessState } from '../../../../components/no-business-state';
import { NumberInput } from '../../../../components/number-input';
import { StickyHeader } from '../../../../components/sticky-header';
import { useNewShortcut } from '../../../../hooks/use-new-shortcut';
import { apiClient, ApiError, buildGridQueryString } from '../../../../lib/api-client';
import { useBusinessContext } from '../../../../context/business-context';
import { hasMinRole, type GridResult, type PosLocation, type PosRack } from '../../../../lib/types';

const EMPTY_FORM = { code: '', name: '', pick_queue: '', is_default_received: false, is_active: true };

export default function LocationRacksPage() {
  const params = useParams<{ locationId: string }>();
  const { businessId, role, loading: businessLoading } = useBusinessContext();

  const [location, setLocation] = useState<PosLocation | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<PosRack | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const canEdit = hasMinRole(role ?? '', 'manager');

  useEffect(() => {
    if (!businessId || !params.locationId) return;
    apiClient<PosLocation>(`/api/businesses/${businessId}/locations/${params.locationId}`).then(setLocation);
  }, [businessId, params.locationId]);

  const fetchData = useCallback(
    async (gridParams: { page: number; size: number; search: string; filter: Record<string, string>; sort: string }) => {
      const qs = buildGridQueryString(gridParams);
      return apiClient<GridResult<PosRack>>(
        `/api/businesses/${businessId}/locations/${params.locationId}/racks?${qs}`,
      );
    },
    [businessId, params.locationId],
  );

  useNewShortcut(openCreate, canEdit && !modalOpen);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setError(null);
    setModalOpen(true);
  }

  function openEdit(rack: PosRack) {
    setEditing(rack);
    setForm({
      code: rack.code,
      name: rack.name ?? '',
      pick_queue: rack.pick_queue != null ? String(rack.pick_queue) : '',
      is_default_received: rack.is_default_received,
      is_active: rack.is_active,
    });
    setError(null);
    setModalOpen(true);
  }

  async function handleSave() {
    if (!businessId || !form.code.trim()) return;
    setSaving(true);
    setError(null);
    const payload = {
      code: form.code,
      name: form.name || undefined,
      pick_queue: form.pick_queue ? Number(form.pick_queue) : undefined,
      is_default_received: form.is_default_received,
      is_active: form.is_active,
    };
    try {
      if (editing) {
        await apiClient(`/api/businesses/${businessId}/racks/${editing.id}`, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
      } else {
        await apiClient(`/api/businesses/${businessId}/locations/${params.locationId}/racks`, {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }
      setModalOpen(false);
      setRefreshTrigger((t) => t + 1);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal menyimpan rak');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(rack: PosRack) {
    if (!businessId) return;
    if (!confirm(`Hapus rak "${rack.code}"?`)) return;
    try {
      await apiClient(`/api/businesses/${businessId}/racks/${rack.id}`, { method: 'DELETE' });
      setRefreshTrigger((t) => t + 1);
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Gagal menghapus rak');
    }
  }

  if (businessLoading) return <LoadingSpinner />;
  if (!businessId) return <NoBusinessState />;

  const columns: GridColumn<PosRack>[] = [
    ...(canEdit
      ? [
          {
            key: 'actions',
            label: 'Aksi',
            render: (_: unknown, row: PosRack) => (
              <div className="flex gap-2">
                <Button as={Link} href={`/dashboard/locations/${params.locationId}/racks/${row.id}`} size="sm" variant="flat" color="primary">
                  Kelola Produk
                </Button>
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
    { key: 'code', label: 'Kode', sortable: true },
    { key: 'name', label: 'Nama', render: (v) => v ?? '—' },
    {
      key: 'pick_queue',
      label: 'Antrian Ambil',
      sortable: true,
      render: (v) => (v != null ? v : '—'),
    },
    {
      key: 'is_default_received',
      label: 'Penerima Default',
      render: (v) => (v ? <Chip size="sm" color="primary" variant="flat">Ya</Chip> : '—'),
    },
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
        <div className="flex items-center justify-between">
          <div>
            <Button as={Link} href="/dashboard/locations" variant="light" size="sm" className="mb-2">
              ← Kembali ke Lokasi
            </Button>
            <h1 className="text-2xl font-bold text-foreground">Rak — {location?.name ?? '...'}</h1>
            <p className="text-sm text-default-500">
              Antrian Ambil = urutan prioritas pengambilan otomatis saat barang keluar (jual/transfer). Penerima
              Default = tujuan otomatis barang masuk (beli/transfer masuk).
            </p>
          </div>
          {canEdit && (
            <Button color="primary" onPress={openCreate}>
              + Tambah Rak
            </Button>
          )}
        </div>
      </StickyHeader>

      <DataGrid<PosRack>
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
        defaultSort="code:asc"
        refreshTrigger={refreshTrigger}
        rowKey={(row) => row.id}
        emptyState={{ title: 'Belum ada rak', description: 'Tambah rak pertama di lokasi ini.', icon: <Archive className="h-8 w-8 text-default-400" /> }}
      />

      <AppModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Rak' : 'Tambah Rak'}
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
            label="Kode Rak"
            placeholder="mis. A1"
            value={form.code}
            onValueChange={(v) => setForm((f) => ({ ...f, code: v.toUpperCase() }))}
            isRequired
          />
          <Input
            label="Nama (opsional)"
            placeholder="mis. Etalase Depan"
            value={form.name}
            onValueChange={(v) => setForm((f) => ({ ...f, name: v }))}
          />
          <NumberInput
            label="Antrian Ambil (opsional)"
            value={form.pick_queue}
            onValueChange={(v) => setForm((f) => ({ ...f, pick_queue: v }))}
          />
          <Switch
            isSelected={form.is_default_received}
            onValueChange={(v) => setForm((f) => ({ ...f, is_default_received: v }))}
          >
            Rak Penerima Default
          </Switch>
          <Switch isSelected={form.is_active} onValueChange={(v) => setForm((f) => ({ ...f, is_active: v }))}>
            Aktif
          </Switch>
          {error && <p className="text-sm text-danger">{error}</p>}
        </div>
      </AppModal>
    </div>
  );
}
