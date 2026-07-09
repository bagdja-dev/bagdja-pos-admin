'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Select, SelectItem, Textarea } from '@heroui/react';

import { AsyncSearchSelect, type AsyncOption } from '../../../components/async-search-select';
import { CurrencyInput } from '../../../components/currency-input';
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

const PARTY_FIELD: Record<PosInvoiceType, { label: string; placeholder: string; contactType?: PosContactType }> = {
  sale: { label: 'Pelanggan', placeholder: 'Cari pelanggan...', contactType: 'customer' },
  purchase: { label: 'Supplier', placeholder: 'Cari supplier...', contactType: 'supplier' },
  transfer: { label: 'Lokasi Tujuan', placeholder: 'Cari lokasi tujuan...' },
  capital: { label: 'Pemberi Modal', placeholder: 'Cari pemberi modal...', contactType: 'lender' },
  withdrawal: { label: 'Diambil Oleh', placeholder: 'Cari pemilik/investor...', contactType: 'lender' },
};

const AMOUNT_LABEL: Partial<Record<PosInvoiceType, string>> = {
  capital: 'Jumlah Modal',
  withdrawal: 'Jumlah Penarikan',
};

/** Faktur `capital`/`withdrawal` sama-sama tanpa barang/jasa — nominalnya langsung dari input `amount`. */
function isAmountBasedType(type: PosInvoiceType): boolean {
  return type === 'capital' || type === 'withdrawal';
}

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
  const [amount, setAmount] = useState('0');
  const [note, setNote] = useState('');
  const [staff, setStaff] = useState<PosStaff[]>([]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [contactModalQuery, setContactModalQuery] = useState('');
  const hasAutoSelectedLocationRef = useRef(false);

  const partyType: PosContactType | 'outlet' =
    type === 'sale'
      ? 'customer'
      : type === 'purchase'
        ? 'supplier'
        : type === 'capital' || type === 'withdrawal'
          ? 'lender'
          : 'outlet';

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

  const grandTotal = isAmountBasedType(type)
    ? Number(amount) || 0
    : calcGrandTotal(items) + (type !== 'transfer' ? calcServiceTotal(services) : 0);

  async function handleSubmit() {
    if (!businessId || !locationId || !partyId) {
      setError('Lokasi dan pihak terkait wajib diisi');
      return;
    }

    if (isAmountBasedType(type)) {
      if (!Number(amount) || Number(amount) <= 0) {
        setError(`${AMOUNT_LABEL[type]} wajib diisi (lebih dari 0)`);
        return;
      }
    } else {
      const validItemsCheck = items.filter((i) => i.product_id && Number(i.quantity) > 0);
      const validServicesCheck = type !== 'transfer' ? services.filter((s) => s.label.trim() && Number(s.amount) > 0) : [];
      if (validItemsCheck.length === 0 && validServicesCheck.length === 0) {
        setError('Minimal ada satu produk atau satu jasa');
        return;
      }
    }

    const validItems = items.filter((i) => i.product_id && Number(i.quantity) > 0);
    const validServices = type !== 'transfer' ? services.filter((s) => s.label.trim() && Number(s.amount) > 0) : [];

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
          items: isAmountBasedType(type)
            ? []
            : validItems.map((i) => ({
                product_id: i.product_id,
                quantity: Number(i.quantity),
                ...(i.adjusted_price ? { adjusted_price: Number(i.adjusted_price) } : {}),
              })),
          ...(isAmountBasedType(type) ? { amount: Number(amount) } : {}),
          ...(type !== 'transfer' && !isAmountBasedType(type) && validServices.length > 0
            ? {
                services: validServices.map((s) => ({
                  ...(s.service_id ? { service_id: s.service_id } : {}),
                  ...(s.mechanic_id ? { mechanic_id: s.mechanic_id } : {}),
                  label: s.label,
                  amount: Number(s.amount),
                })),
              }
            : {}),
          ...(note.trim() ? { note: note.trim() } : {}),
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
          <SelectItem key="capital">Modal</SelectItem>
          <SelectItem key="withdrawal">Penarikan</SelectItem>
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
          label={PARTY_FIELD[type].label}
          placeholder={PARTY_FIELD[type].placeholder}
          selectedId={partyId}
          selectedLabel={partyLabel}
          onSelect={(id, label) => {
            setPartyId(id);
            setPartyLabel(label);
          }}
          fetchOptions={fetchPartyOptions}
          onCreateNew={
            PARTY_FIELD[type].contactType
              ? (query) => {
                  setContactModalQuery(query);
                  setContactModalOpen(true);
                }
              : undefined
          }
          createNewLabel={(q) => `Tambah "${q}" sebagai ${PARTY_FIELD[type].label.toLowerCase()} baru`}
          isRequired
        />
      </div>

      {isAmountBasedType(type) ? (
        <CurrencyInput label={AMOUNT_LABEL[type]} value={amount} onValueChange={setAmount} isRequired />
      ) : (
        <>
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
        </>
      )}

      <Textarea
        label="Catatan (opsional)"
        placeholder="Catatan tambahan untuk faktur ini..."
        value={note}
        onValueChange={setNote}
      />

      {error && <p className="text-sm text-danger">{error}</p>}

      <Button color="primary" fullWidth isLoading={saving} onPress={handleSubmit}>
        Simpan sebagai Draft
      </Button>

      {businessId && PARTY_FIELD[type].contactType && (
        <QuickAddContactModal
          isOpen={contactModalOpen}
          onClose={() => setContactModalOpen(false)}
          businessId={businessId}
          type={PARTY_FIELD[type].contactType!}
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
