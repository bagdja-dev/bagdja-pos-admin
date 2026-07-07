'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Button,
  Input,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from '@heroui/react';

import { AppModal } from '../../components/app-modal';
import { LoadingSpinner } from '../../components/loading-spinner';
import { NoBusinessState } from '../../components/no-business-state';
import { apiClient, ApiError } from '../../lib/api-client';
import { useBusinessContext } from '../../context/business-context';
import { hasMinRole, type ServiceItem } from '../../lib/types';

const EMPTY_FORM = { name: '', default_price: '0', is_active: true };

function formatCurrency(value: string) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(
    Number(value),
  );
}

export default function ServicesPage() {
  const { businessId, role, loading: businessLoading } = useBusinessContext();
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ServiceItem | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canEdit = hasMinRole(role ?? '', 'manager');

  const load = useCallback(async () => {
    if (!businessId) return;
    setLoading(true);
    try {
      const data = await apiClient<ServiceItem[]>(`/api/businesses/${businessId}/services`);
      setServices(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal memuat jasa');
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
      await load();
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
      await load();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Gagal menghapus jasa');
    }
  }

  if (businessLoading) return <LoadingSpinner />;
  if (!businessId) return <NoBusinessState />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Jasa / Layanan</h1>
          <p className="text-sm text-default-500">Master ongkos jasa (mis. Ongkos Pasang Ban).</p>
        </div>
        {canEdit && (
          <Button color="primary" onPress={openCreate}>
            + Tambah Jasa
          </Button>
        )}
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <Table aria-label="Daftar jasa">
          <TableHeader>
            <TableColumn>NAMA</TableColumn>
            <TableColumn>HARGA DEFAULT</TableColumn>
            <TableColumn>STATUS</TableColumn>
            <TableColumn>AKSI</TableColumn>
          </TableHeader>
          <TableBody emptyContent="Belum ada jasa">
            {services.map((s) => (
              <TableRow key={s.id}>
                <TableCell>{s.name}</TableCell>
                <TableCell>{formatCurrency(s.default_price)}</TableCell>
                <TableCell>{s.is_active ? 'Aktif' : 'Nonaktif'}</TableCell>
                <TableCell>
                  {canEdit && (
                    <div className="flex gap-2">
                      <Button size="sm" variant="flat" onPress={() => openEdit(s)}>
                        Edit
                      </Button>
                      <Button size="sm" variant="flat" color="danger" onPress={() => handleDelete(s)}>
                        Hapus
                      </Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

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
            onValueChange={(v) => setForm((f) => ({ ...f, name: v }))}
            isRequired
          />
          <Input
            label="Harga Default"
            type="number"
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
