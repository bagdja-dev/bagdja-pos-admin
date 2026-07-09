'use client';

import { useCallback, useState } from 'react';
import { Button, Input, Select, SelectItem } from '@heroui/react';
import { Users } from 'lucide-react';

import { AppModal } from '../../components/app-modal';
import { DataGrid, type GridColumn } from '../../components/data-grid';
import { LoadingSpinner } from '../../components/loading-spinner';
import { NoBusinessState } from '../../components/no-business-state';
import { useNewShortcut } from '../../hooks/use-new-shortcut';
import { apiClient, ApiError, buildGridQueryString } from '../../lib/api-client';
import { useBusinessContext } from '../../context/business-context';
import { hasMinRole, type GridResult, type PosContact, type PosContactType } from '../../lib/types';

const EMPTY_FORM = { type: 'customer' as PosContactType, name: '', phone: '', plate_number: '' };

const CONTACT_TYPE_LABELS: Record<PosContactType, string> = {
  customer: 'Pelanggan',
  supplier: 'Supplier',
  lender: 'Pemberi Modal',
};

export default function ContactsPage() {
  const { businessId, role, loading: businessLoading } = useBusinessContext();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<PosContact | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const canEdit = hasMinRole(role ?? '', 'cashier');
  const canDelete = hasMinRole(role ?? '', 'manager');

  const fetchData = useCallback(
    async (params: { page: number; size: number; search: string; filter: Record<string, string>; sort: string }) => {
      const qs = buildGridQueryString(params);
      return apiClient<GridResult<PosContact>>(`/api/businesses/${businessId}/contacts?${qs}`);
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

  function openEdit(c: PosContact) {
    setEditing(c);
    setForm({ type: c.type, name: c.name, phone: c.phone ?? '', plate_number: c.plate_number ?? '' });
    setError(null);
    setModalOpen(true);
  }

  async function handleSave() {
    if (!businessId || !form.name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      if (editing) {
        await apiClient(`/api/businesses/${businessId}/contacts/${editing.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ name: form.name, phone: form.phone, plate_number: form.plate_number }),
        });
      } else {
        await apiClient(`/api/businesses/${businessId}/contacts`, {
          method: 'POST',
          body: JSON.stringify(form),
        });
      }
      setModalOpen(false);
      setRefreshTrigger((t) => t + 1);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal menyimpan kontak');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(c: PosContact) {
    if (!businessId) return;
    if (!confirm(`Hapus kontak "${c.name}"?`)) return;
    try {
      await apiClient(`/api/businesses/${businessId}/contacts/${c.id}`, { method: 'DELETE' });
      setRefreshTrigger((t) => t + 1);
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Gagal menghapus kontak');
    }
  }

  if (businessLoading) return <LoadingSpinner />;
  if (!businessId) return <NoBusinessState />;

  const columns: GridColumn<PosContact>[] = [
    { key: 'name', label: 'Nama', sortable: true },
    { key: 'type', label: 'Tipe', sortable: true, render: (v: PosContactType) => CONTACT_TYPE_LABELS[v] },
    { key: 'phone', label: 'Telepon', render: (v) => v ?? '—' },
    { key: 'plate_number', label: 'Plat Nomor', render: (v) => v ?? '—' },
    ...(canEdit
      ? [
          {
            key: 'actions',
            label: 'Aksi',
            render: (_: unknown, row: PosContact) => (
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
          <h1 className="text-2xl font-bold text-foreground">Kontak</h1>
          <p className="text-sm text-default-500">Pelanggan, supplier, & pemberi modal.</p>
        </div>
        {canEdit && (
          <Button color="primary" onPress={openCreate}>
            + Tambah Kontak
          </Button>
        )}
      </div>

      <DataGrid<PosContact>
        columns={columns}
        fetchData={fetchData}
        filterFields={[
          {
            key: 'type',
            label: 'Tipe',
            type: 'select',
            options: [
              { label: 'Pelanggan', value: 'customer' },
              { label: 'Supplier', value: 'supplier' },
              { label: 'Pemberi Modal', value: 'lender' },
            ],
          },
        ]}
        defaultSort="name:asc"
        refreshTrigger={refreshTrigger}
        rowKey={(row) => row.id}
        emptyState={{ title: 'Belum ada kontak', description: 'Tambah pelanggan atau supplier pertama.', icon: <Users className="h-8 w-8 text-default-400" /> }}
      />

      <AppModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit Kontak' : 'Tambah Kontak'}
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
          {!editing && (
            <Select
              label="Tipe"
              selectedKeys={[form.type]}
              onSelectionChange={(keys) => setForm((f) => ({ ...f, type: Array.from(keys)[0] as PosContactType }))}
            >
              <SelectItem key="customer">Pelanggan</SelectItem>
              <SelectItem key="supplier">Supplier</SelectItem>
              <SelectItem key="lender">Pemberi Modal</SelectItem>
            </Select>
          )}
          <Input
            label="Nama"
            value={form.name}
            onValueChange={(v) => setForm((f) => ({ ...f, name: v.toUpperCase() }))}
            isRequired
          />
          <Input label="Telepon" value={form.phone} onValueChange={(v) => setForm((f) => ({ ...f, phone: v }))} />
          {form.type === 'customer' && (
            <Input
              label="Plat Nomor (opsional)"
              value={form.plate_number}
              onValueChange={(v) => setForm((f) => ({ ...f, plate_number: v }))}
            />
          )}
          {error && <p className="text-sm text-danger">{error}</p>}
        </div>
      </AppModal>
    </div>
  );
}
