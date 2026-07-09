'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Select, SelectItem } from '@heroui/react';

import { AsyncSearchSelect, type AsyncOption } from '../../../components/async-search-select';
import { EMPTY_ITEM_ROW, ItemRowsEditor, calcGrandTotal, formatCurrency, type ItemRow } from '../../../components/invoice-item-rows';
import { ServiceRowsEditor, calcServiceTotal, type ServiceRow } from '../../../components/invoice-service-rows';
import { LoadingSpinner } from '../../../components/loading-spinner';
import { NoBusinessState } from '../../../components/no-business-state';
import { QuickAddContactModal } from '../../../components/quick-add-contact-modal';
import { apiClient, ApiError } from '../../../lib/api-client';
import { useBusinessContext } from '../../../context/business-context';
import {
  LOCATION_TYPE_LABELS,
  type GridResult,
  type PosContact,
  type PosContactType,
  type PosInvoice,
  type PosInvoiceType,
  type PosLocation,
  type PosProduct,
  type PosStaff,
  type ServiceItem,
} from '../../../lib/types';

export default function NewInvoicePage() {
  const router = useRouter();
  const { businessId, loading: businessLoading } = useBusinessContext();

  const [type, setType] = useState<PosInvoiceType>('sale');
  const [locationId, setLocationId] = useState('');
  const [locationLabel, setLocationLabel] = useState('');
  const [partyId, setPartyId] = useState('');
  const [partyLabel, setPartyLabel] = useState('');
  const [items, setItems] = useState<ItemRow[]>([{ ...EMPTY_ITEM_ROW }]);
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [staff, setStaff] = useState<PosStaff[]>([]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [contactModalQuery, setContactModalQuery] = useState('');
  const hasAutoSelectedLocationRef = useRef(false);

  const partyType: PosContactType | 'outlet' = type === 'sale' ? 'customer' : type === 'purchase' ? 'supplier' : 'outlet';

  useEffect(() => {
    if (!businessId) return;
    apiClient<PosStaff[]>(`/api/businesses/${businessId}/staff`)
      .then(setStaff)
      .catch(() => setStaff([]));
  }, [businessId]);

  useEffect(() => {
    if (!businessId || hasAutoSelectedLocationRef.current) return;

    let cancelled = false;
    hasAutoSelectedLocationRef.current = true;

    apiClient<GridResult<PosLocation>>(`/api/businesses/${businessId}/locations?size=20`)
      .then((res) => {
        if (cancelled || !res.data?.length) return;
        const firstLocation = res.data[0];
        setLocationId(firstLocation.id);
        setLocationLabel(firstLocation.name);
      })
      .catch(() => {
        if (!cancelled) {
          hasAutoSelectedLocationRef.current = false;
        }
      });

    return () => {
      cancelled = true;
    };
  }, [businessId]);

  const fetchLocationOptions = useCallback(
    async (search: string): Promise<AsyncOption[]> => {
      if (!businessId) return [];
      const res = await apiClient<GridResult<PosLocation>>(
        `/api/businesses/${businessId}/locations?search=${encodeURIComponent(search)}&size=20`,
      );
      return res.data.map((l) => ({ id: l.id, label: l.name, description: LOCATION_TYPE_LABELS[l.type] ?? l.type }));
    },
    [businessId],
  );

  const fetchPartyOptions = useCallback(
    async (search: string): Promise<AsyncOption[]> => {
      if (!businessId) return [];
      if (type === 'transfer') {
        const res = await apiClient<GridResult<PosLocation>>(
          `/api/businesses/${businessId}/locations?search=${encodeURIComponent(search)}&size=20`,
        );
        return res.data
          .filter((l) => l.id !== locationId)
          .map((l) => ({ id: l.id, label: l.name, description: LOCATION_TYPE_LABELS[l.type] ?? l.type }));
      }
      const res = await apiClient<GridResult<PosContact>>(
        `/api/businesses/${businessId}/contacts?search=${encodeURIComponent(search)}&filter[type]=${partyType}&size=20`,
      );
      return res.data.map((c) => ({ id: c.id, label: c.name, description: c.phone ?? c.plate_number ?? undefined }));
    },
    [businessId, type, partyType, locationId],
  );

  const fetchProductOptions = useCallback(
    async (search: string): Promise<AsyncOption[]> => {
      if (!businessId) return [];
      const res = await apiClient<GridResult<PosProduct>>(
        `/api/businesses/${businessId}/products?search=${encodeURIComponent(search)}&size=20`,
      );
      return res.data.map((p) => ({
        id: p.id,
        label: `${p.name} (${p.sku})`,
        description: p.tags?.length ? p.tags.join(', ') : undefined,
        raw: p,
      }));
    },
    [businessId],
  );

  const fetchServiceOptions = useCallback(
    async (search: string): Promise<AsyncOption[]> => {
      if (!businessId) return [];
      const res = await apiClient<GridResult<ServiceItem>>(
        `/api/businesses/${businessId}/services?search=${encodeURIComponent(search)}&size=20`,
      );
      return res.data.map((s) => ({ id: s.id, label: s.name, raw: s }));
    },
    [businessId],
  );

  const grandTotal = calcGrandTotal(items) + (type !== 'transfer' ? calcServiceTotal(services) : 0);

  async function handleSubmit() {
    if (!businessId || !locationId || !partyId) {
      setError('Lokasi dan pihak terkait wajib diisi');
      return;
    }
    const validItems = items.filter((i) => i.product_id && Number(i.quantity) > 0);
    const validServices = type !== 'transfer' ? services.filter((s) => s.label.trim() && Number(s.amount) > 0) : [];
    if (validItems.length === 0 && validServices.length === 0) {
      setError('Minimal ada satu produk atau satu jasa');
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
          ...(type !== 'transfer' && validServices.length > 0
            ? {
                services: validServices.map((s) => ({
                  ...(s.service_id ? { service_id: s.service_id } : {}),
                  ...(s.mechanic_id ? { mechanic_id: s.mechanic_id } : {}),
                  label: s.label,
                  amount: Number(s.amount),
                })),
              }
            : {}),
        }),
      });
      router.push(`/dashboard/invoices/${invoice.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal membuat faktur');
    } finally {
      setSaving(false);
    }
  }

  if (businessLoading) return <LoadingSpinner />;
  if (!businessId) return <NoBusinessState />;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-foreground">Buat Faktur</h1>
        <div className="rounded-2xl border border-default-200 bg-default-50 px-5 py-2.5 text-right">
          <p className="text-[10px] font-bold uppercase tracking-wider text-default-500">Total Faktur</p>
          <p className="text-lg font-bold text-foreground">{formatCurrency(grandTotal)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <Select
          label="Tipe Faktur"
          selectedKeys={[type]}
          onSelectionChange={(keys) => {
            setType(Array.from(keys)[0] as PosInvoiceType);
            setPartyId('');
            setPartyLabel('');
          }}
        >
          <SelectItem key="sale">Penjualan</SelectItem>
          <SelectItem key="purchase">Pembelian</SelectItem>
          <SelectItem key="transfer">Mutasi Antar Lokasi</SelectItem>
        </Select>

        <AsyncSearchSelect
          label={type === 'transfer' ? 'Lokasi Asal' : 'Lokasi'}
          placeholder="Cari lokasi..."
          selectedId={locationId}
          selectedLabel={locationLabel}
          onSelect={(id, label) => {
            setLocationId(id);
            setLocationLabel(label);
          }}
          fetchOptions={fetchLocationOptions}
          isRequired
        />

        <AsyncSearchSelect
          label={type === 'sale' ? 'Pelanggan' : type === 'purchase' ? 'Supplier' : 'Lokasi Tujuan'}
          placeholder={type === 'sale' ? 'Cari pelanggan...' : type === 'purchase' ? 'Cari supplier...' : 'Cari lokasi tujuan...'}
          selectedId={partyId}
          selectedLabel={partyLabel}
          onSelect={(id, label) => {
            setPartyId(id);
            setPartyLabel(label);
          }}
          fetchOptions={fetchPartyOptions}
          onCreateNew={
            type !== 'transfer'
              ? (query) => {
                  setContactModalQuery(query);
                  setContactModalOpen(true);
                }
              : undefined
          }
          createNewLabel={(q) => `Tambah "${q}" sebagai ${type === 'sale' ? 'pelanggan' : 'supplier'} baru`}
          isRequired
        />
      </div>

      <ItemRowsEditor items={items} onChange={setItems} invoiceType={type} fetchProductOptions={fetchProductOptions} />

      {type !== 'transfer' && (
        <ServiceRowsEditor
          rows={services}
          onChange={setServices}
          mechanics={staff}
          fetchServiceOptions={fetchServiceOptions}
          businessId={businessId}
        />
      )}

      {error && <p className="text-sm text-danger">{error}</p>}

      <Button color="primary" fullWidth isLoading={saving} onPress={handleSubmit}>
        Simpan sebagai Draft
      </Button>

      {businessId && type !== 'transfer' && (
        <QuickAddContactModal
          isOpen={contactModalOpen}
          onClose={() => setContactModalOpen(false)}
          businessId={businessId}
          type={type === 'sale' ? 'customer' : 'supplier'}
          initialName={contactModalQuery}
          onCreated={(contact) => {
            setPartyId(contact.id);
            setPartyLabel(contact.name);
          }}
        />
      )}
    </div>
  );
}
