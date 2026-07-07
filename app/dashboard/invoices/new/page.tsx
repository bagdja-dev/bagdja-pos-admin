'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input, Select, SelectItem } from '@heroui/react';

import { LoadingSpinner } from '../../../components/loading-spinner';
import { NoBusinessState } from '../../../components/no-business-state';
import { apiClient, ApiError } from '../../../lib/api-client';
import { useBusinessContext } from '../../../context/business-context';
import type { PosContact, PosContactType, PosInvoice, PosInvoiceType, PosLocation, PosProduct } from '../../../lib/types';

interface ItemRow {
  product_id: string;
  quantity: string;
  adjusted_price: string;
}

export default function NewInvoicePage() {
  const router = useRouter();
  const { businessId, loading: businessLoading } = useBusinessContext();

  const [type, setType] = useState<PosInvoiceType>('sale');
  const [locationId, setLocationId] = useState('');
  const [partyId, setPartyId] = useState('');
  const [items, setItems] = useState<ItemRow[]>([{ product_id: '', quantity: '1', adjusted_price: '' }]);

  const [locations, setLocations] = useState<PosLocation[]>([]);
  const [contacts, setContacts] = useState<PosContact[]>([]);
  const [products, setProducts] = useState<PosProduct[]>([]);
  const [loadingRefs, setLoadingRefs] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!businessId) return;
    setLoadingRefs(true);
    Promise.all([
      apiClient<PosLocation[]>(`/api/businesses/${businessId}/locations`),
      apiClient<PosContact[]>(`/api/businesses/${businessId}/contacts`),
      apiClient<PosProduct[]>(`/api/businesses/${businessId}/products`),
    ])
      .then(([loc, con, prod]) => {
        setLocations(loc);
        setContacts(con);
        setProducts(prod);
      })
      .finally(() => setLoadingRefs(false));
  }, [businessId]);

  const partyType: PosContactType | 'outlet' = type === 'sale' ? 'customer' : type === 'purchase' ? 'supplier' : 'outlet';
  const partyOptions =
    type === 'transfer'
      ? locations.filter((l) => l.id !== locationId)
      : contacts.filter((c) => c.type === partyType);

  function updateItem(index: number, patch: Partial<ItemRow>) {
    setItems((rows) => rows.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }

  function addItem() {
    setItems((rows) => [...rows, { product_id: '', quantity: '1', adjusted_price: '' }]);
  }

  function removeItem(index: number) {
    setItems((rows) => rows.filter((_, i) => i !== index));
  }

  async function handleSubmit() {
    if (!businessId || !locationId || !partyId) {
      setError('Lokasi dan pihak terkait wajib diisi');
      return;
    }
    const validItems = items.filter((i) => i.product_id && Number(i.quantity) > 0);
    if (validItems.length === 0) {
      setError('Minimal 1 baris produk dengan quantity valid');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const invoice = await apiClient<PosInvoice>(`/api/businesses/${businessId}/invoices`, {
        method: 'POST',
        body: JSON.stringify({
          type,
          location_id: locationId,
          party_type: partyType,
          party_id: partyId,
          items: validItems.map((i) => ({
            product_id: i.product_id,
            quantity: Number(i.quantity),
            ...(i.adjusted_price ? { adjusted_price: Number(i.adjusted_price) } : {}),
          })),
        }),
      });
      router.push(`/dashboard/invoices/${invoice.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal membuat faktur');
    } finally {
      setSaving(false);
    }
  }

  if (businessLoading || loadingRefs) return <LoadingSpinner />;
  if (!businessId) return <NoBusinessState />;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Buat Faktur</h1>

      <Select
        label="Tipe Faktur"
        selectedKeys={[type]}
        onSelectionChange={(keys) => {
          setType(Array.from(keys)[0] as PosInvoiceType);
          setPartyId('');
        }}
      >
        <SelectItem key="sale">Penjualan</SelectItem>
        <SelectItem key="purchase">Pembelian</SelectItem>
        <SelectItem key="transfer">Mutasi Antar Lokasi</SelectItem>
      </Select>

      <Select
        label={type === 'transfer' ? 'Lokasi Asal' : 'Lokasi'}
        selectedKeys={locationId ? [locationId] : []}
        onSelectionChange={(keys) => setLocationId(Array.from(keys)[0] as string)}
      >
        {locations.map((loc) => (
          <SelectItem key={loc.id}>{loc.name}</SelectItem>
        ))}
      </Select>

      <Select
        label={type === 'sale' ? 'Pelanggan' : type === 'purchase' ? 'Supplier' : 'Lokasi Tujuan'}
        selectedKeys={partyId ? [partyId] : []}
        onSelectionChange={(keys) => setPartyId(Array.from(keys)[0] as string)}
      >
        {partyOptions.map((opt) => (
          <SelectItem key={opt.id}>{opt.name}</SelectItem>
        ))}
      </Select>

      <div className="space-y-3">
        <p className="text-sm font-medium text-foreground">Barang</p>
        {items.map((item, idx) => (
          <div key={idx} className="flex items-end gap-2">
            <Select
              label="Produk"
              className="flex-1"
              selectedKeys={item.product_id ? [item.product_id] : []}
              onSelectionChange={(keys) => updateItem(idx, { product_id: Array.from(keys)[0] as string })}
            >
              {products.map((p) => (
                <SelectItem key={p.id}>{`${p.name} (${p.sku})`}</SelectItem>
              ))}
            </Select>
            <Input
              label="Qty"
              type="number"
              className="w-24"
              value={item.quantity}
              onValueChange={(v) => updateItem(idx, { quantity: v })}
            />
            <Input
              label="Harga (opsional)"
              type="number"
              className="w-36"
              value={item.adjusted_price}
              onValueChange={(v) => updateItem(idx, { adjusted_price: v })}
            />
            <Button size="sm" variant="flat" color="danger" onPress={() => removeItem(idx)} isDisabled={items.length === 1}>
              Hapus
            </Button>
          </div>
        ))}
        <Button size="sm" variant="flat" onPress={addItem}>
          + Tambah Baris
        </Button>
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      <Button color="primary" fullWidth isLoading={saving} onPress={handleSubmit}>
        Simpan sebagai Draft
      </Button>
    </div>
  );
}
