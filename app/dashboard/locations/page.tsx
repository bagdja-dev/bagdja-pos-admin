'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Button,
  Input,
  Select,
  SelectItem,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  Textarea,
} from '@heroui/react';

import { AppModal } from '../../components/app-modal';
import { LoadingSpinner } from '../../components/loading-spinner';
import { NoBusinessState } from '../../components/no-business-state';
import { apiClient, ApiError } from '../../lib/api-client';
import { useBusinessContext } from '../../context/business-context';
import { hasMinRole, LOCATION_TYPE_LABELS, type PosLocation } from '../../lib/types';

const EMPTY_FORM = { name: '', type: 'store', address: '', is_active: true };

export default function LocationsPage() {
  const { businessId, role, loading: businessLoading } = useBusinessContext();
  const [locations, setLocations] = useState<PosLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<PosLocation | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canEdit = hasMinRole(role ?? '', 'manager');
  const canDelete = hasMinRole(role ?? '', 'owner');

  const load = useCallback(async () => {
    if (!businessId) return;
    setLoading(true);
    try {
      const data = await apiClient<PosLocation[]>(`/api/businesses/${businessId}/locations`);
      setLocations(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal memuat lokasi');
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    void load();
  }, [load]);

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
      await load();
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
      await load();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Gagal menghapus lokasi');
    }
  }

  if (businessLoading) return <LoadingSpinner />;
  if (!businessId) return <NoBusinessState />;

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

      {loading ? (
        <LoadingSpinner />
      ) : (
        <Table aria-label="Daftar lokasi">
          <TableHeader>
            <TableColumn>NAMA</TableColumn>
            <TableColumn>TIPE</TableColumn>
            <TableColumn>ALAMAT</TableColumn>
            <TableColumn>STATUS</TableColumn>
            <TableColumn>AKSI</TableColumn>
          </TableHeader>
          <TableBody emptyContent="Belum ada lokasi">
            {locations.map((loc) => (
              <TableRow key={loc.id}>
                <TableCell>{loc.name}</TableCell>
                <TableCell>{LOCATION_TYPE_LABELS[loc.type] ?? loc.type}</TableCell>
                <TableCell>{loc.address ?? '—'}</TableCell>
                <TableCell>{loc.is_active ? 'Aktif' : 'Nonaktif'}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    {canEdit && (
                      <Button size="sm" variant="flat" onPress={() => openEdit(loc)}>
                        Edit
                      </Button>
                    )}
                    {canDelete && (
                      <Button size="sm" variant="flat" color="danger" onPress={() => handleDelete(loc)}>
                        Hapus
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

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
            onValueChange={(v) => setForm((f) => ({ ...f, name: v }))}
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
