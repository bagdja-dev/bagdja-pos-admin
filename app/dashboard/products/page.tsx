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
import { hasMinRole, type PosProduct } from '../../lib/types';

const EMPTY_FORM = { sku: '', name: '', purchase_price: '0', sale_price: '0', min_stock: '0', is_active: true };

function formatCurrency(value: string) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(
    Number(value),
  );
}

export default function ProductsPage() {
  const { businessId, role, loading: businessLoading } = useBusinessContext();
  const [products, setProducts] = useState<PosProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<PosProduct | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canEdit = hasMinRole(role ?? '', 'manager');

  const load = useCallback(async () => {
    if (!businessId) return;
    setLoading(true);
    try {
      const data = await apiClient<PosProduct[]>(`/api/businesses/${businessId}/products`);
      setProducts(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal memuat produk');
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

  function openEdit(p: PosProduct) {
    setEditing(p);
    setForm({
      sku: p.sku,
      name: p.name,
      purchase_price: p.purchase_price,
      sale_price: p.sale_price,
      min_stock: String(p.min_stock),
      is_active: p.is_active,
    });
    setError(null);
    setModalOpen(true);
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
      await load();
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
      await load();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Gagal menghapus produk');
    }
  }

  if (businessLoading) return <LoadingSpinner />;
  if (!businessId) return <NoBusinessState />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Produk</h1>
          <p className="text-sm text-default-500">Master katalog produk (harga beli/jual, stok minimum).</p>
        </div>
        {canEdit && (
          <Button color="primary" onPress={openCreate}>
            + Tambah Produk
          </Button>
        )}
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <Table aria-label="Daftar produk">
          <TableHeader>
            <TableColumn>SKU</TableColumn>
            <TableColumn>NAMA</TableColumn>
            <TableColumn>HARGA BELI</TableColumn>
            <TableColumn>HARGA JUAL</TableColumn>
            <TableColumn>STOK MIN</TableColumn>
            <TableColumn>STATUS</TableColumn>
            <TableColumn>AKSI</TableColumn>
          </TableHeader>
          <TableBody emptyContent="Belum ada produk">
            {products.map((p) => (
              <TableRow key={p.id}>
                <TableCell>{p.sku}</TableCell>
                <TableCell>{p.name}</TableCell>
                <TableCell>{formatCurrency(p.purchase_price)}</TableCell>
                <TableCell>{formatCurrency(p.sale_price)}</TableCell>
                <TableCell>{p.min_stock}</TableCell>
                <TableCell>{p.is_active ? 'Aktif' : 'Nonaktif'}</TableCell>
                <TableCell>
                  {canEdit && (
                    <div className="flex gap-2">
                      <Button size="sm" variant="flat" onPress={() => openEdit(p)}>
                        Edit
                      </Button>
                      <Button size="sm" variant="flat" color="danger" onPress={() => handleDelete(p)}>
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
          <Input label="SKU" value={form.sku} onValueChange={(v) => setForm((f) => ({ ...f, sku: v }))} isRequired />
          <Input
            label="Nama Produk"
            value={form.name}
            onValueChange={(v) => setForm((f) => ({ ...f, name: v }))}
            isRequired
          />
          <Input
            label="Harga Beli"
            type="number"
            value={form.purchase_price}
            onValueChange={(v) => setForm((f) => ({ ...f, purchase_price: v }))}
          />
          <Input
            label="Harga Jual"
            type="number"
            value={form.sale_price}
            onValueChange={(v) => setForm((f) => ({ ...f, sale_price: v }))}
          />
          <Input
            label="Stok Minimum"
            type="number"
            value={form.min_stock}
            onValueChange={(v) => setForm((f) => ({ ...f, min_stock: v }))}
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
