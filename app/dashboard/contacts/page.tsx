'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  Button,
  Input,
  Select,
  SelectItem,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  Tabs,
  Tab,
} from '@heroui/react';

import { AppModal } from '../../components/app-modal';
import { LoadingSpinner } from '../../components/loading-spinner';
import { NoBusinessState } from '../../components/no-business-state';
import { apiClient, ApiError } from '../../lib/api-client';
import { useBusinessContext } from '../../context/business-context';
import { hasMinRole, type PosContact, type PosContactType } from '../../lib/types';

const EMPTY_FORM = { type: 'customer' as PosContactType, name: '', phone: '', plate_number: '' };

export default function ContactsPage() {
  const { businessId, role, loading: businessLoading } = useBusinessContext();
  const [contacts, setContacts] = useState<PosContact[]>([]);
  const [filter, setFilter] = useState<'all' | PosContactType>('all');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<PosContact | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canEdit = hasMinRole(role ?? '', 'cashier');
  const canDelete = hasMinRole(role ?? '', 'manager');

  const load = useCallback(async () => {
    if (!businessId) return;
    setLoading(true);
    try {
      const qs = filter !== 'all' ? `?type=${filter}` : '';
      const data = await apiClient<PosContact[]>(`/api/businesses/${businessId}/contacts${qs}`);
      setContacts(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal memuat kontak');
    } finally {
      setLoading(false);
    }
  }, [businessId, filter]);

  useEffect(() => {
    void load();
  }, [load]);

  function openCreate() {
    setEditing(null);
    setForm({ ...EMPTY_FORM, type: filter === 'supplier' ? 'supplier' : 'customer' });
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
      await load();
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
      await load();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Gagal menghapus kontak');
    }
  }

  if (businessLoading) return <LoadingSpinner />;
  if (!businessId) return <NoBusinessState />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Kontak</h1>
          <p className="text-sm text-default-500">Pelanggan & supplier.</p>
        </div>
        {canEdit && (
          <Button color="primary" onPress={openCreate}>
            + Tambah Kontak
          </Button>
        )}
      </div>

      <Tabs selectedKey={filter} onSelectionChange={(k) => setFilter(k as typeof filter)}>
        <Tab key="all" title="Semua" />
        <Tab key="customer" title="Pelanggan" />
        <Tab key="supplier" title="Supplier" />
      </Tabs>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <Table aria-label="Daftar kontak">
          <TableHeader>
            <TableColumn>NAMA</TableColumn>
            <TableColumn>TIPE</TableColumn>
            <TableColumn>TELEPON</TableColumn>
            <TableColumn>PLAT NOMOR</TableColumn>
            <TableColumn>AKSI</TableColumn>
          </TableHeader>
          <TableBody emptyContent="Belum ada kontak">
            {contacts.map((c) => (
              <TableRow key={c.id}>
                <TableCell>{c.name}</TableCell>
                <TableCell>{c.type === 'customer' ? 'Pelanggan' : 'Supplier'}</TableCell>
                <TableCell>{c.phone ?? '—'}</TableCell>
                <TableCell>{c.plate_number ?? '—'}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    {canEdit && (
                      <Button size="sm" variant="flat" onPress={() => openEdit(c)}>
                        Edit
                      </Button>
                    )}
                    {canDelete && (
                      <Button size="sm" variant="flat" color="danger" onPress={() => handleDelete(c)}>
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
            </Select>
          )}
          <Input
            label="Nama"
            value={form.name}
            onValueChange={(v) => setForm((f) => ({ ...f, name: v }))}
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
