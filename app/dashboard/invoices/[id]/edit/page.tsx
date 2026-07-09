'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@heroui/react';

import { AsyncSearchSelect, type AsyncOption } from '../../../../components/async-search-select';
import { EMPTY_ITEM_ROW, ItemRowsEditor, calcGrandTotal, formatCurrency, type ItemRow } from '../../../../components/invoice-item-rows';
import { ServiceRowsEditor, calcServiceTotal, type ServiceRow } from '../../../../components/invoice-service-rows';
import { LoadingSpinner } from '../../../../components/loading-spinner';
import { NoBusinessState } from '../../../../components/no-business-state';
import { QuickAddContactModal } from '../../../../components/quick-add-contact-modal';
import { ReadOnlyField } from '../../../../components/read-only-field';
import { apiClient, ApiError } from '../../../../lib/api-client';
import { useBusinessContext } from '../../../../context/business-context';
import {
  INVOICE_TYPE_LABELS,
  LOCATION_TYPE_LABELS,
  type GridResult,
  type PosContact,
  type PosContactType,
  type PosInvoice,
  type PosLocation,
  type PosProduct,
  type PosStaff,
  type ServiceItem,
} from '../../../../lib/types';

export default function EditInvoicePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { businessId, loading: businessLoading } = useBusinessContext();

  const [invoice, setInvoice] = useState<PosInvoice | null>(null);
  const [locationLabel, setLocationLabel] = useState('');
  const [partyId, setPartyId] = useState('');
  const [partyLabel, setPartyLabel] = useState('');
  const [items, setItems] = useState<ItemRow[]>([{ ...EMPTY_ITEM_ROW }]);
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [staff, setStaff] = useState<PosStaff[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [contactModalQuery, setContactModalQuery] = useState('');

  useEffect(() => {
    if (!businessId || !params.id) return;
    setLoading(true);
    apiClient<PosInvoice>(`/api/businesses/${businessId}/invoices/${params.id}`)
      .then((inv) => {
        setInvoice(inv);
        setPartyId(inv.party_id);
        setLocationLabel(inv.location?.name ?? '');
        setPartyLabel(inv.party?.name ?? '');
        setItems(
          (inv.items ?? []).map((it) => ({
            product_id: it.product_id,
            product_label: it.product ? `${it.product.name} (${it.product.sku})` : it.product_id,
            quantity: String(it.quantity),
            adjusted_price: it.adjusted_price,
            default_price: it.product ? (inv.type === 'purchase' ? it.product.purchase_price : it.product.sale_price) : '',
          })),
        );
        setServices(
          (inv.services ?? []).map((s) => ({
            service_id: s.service_id ?? '',
            service_label: '',
            mechanic_id: s.mechanic_id ?? '',
            label: s.label,
            amount: s.amount,
          })),
        );
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Gagal memuat faktur'))
      .finally(() => setLoading(false));
  }, [businessId, params.id]);

  useEffect(() => {
    if (!businessId) return;
    apiClient<PosStaff[]>(`/api/businesses/${businessId}/staff`)
      .then(setStaff)
      .catch(() => setStaff([]));
  }, [businessId]);

  const fetchPartyOptions = useCallback(
    async (search: string): Promise<AsyncOption[]> => {
      if (!businessId || !invoice) return [];
      if (invoice.party_type === 'outlet') {
        const res = await apiClient<GridResult<PosLocation>>(
          `/api/businesses/${businessId}/locations?search=${encodeURIComponent(search)}&size=20`,
        );
        return res.data
          .filter((l) => l.id !== invoice.location_id)
          .map((l) => ({ id: l.id, label: l.name, description: LOCATION_TYPE_LABELS[l.type] ?? l.type }));
      }
      const partyType: PosContactType = invoice.party_type === 'customer' ? 'customer' : 'supplier';
      const res = await apiClient<GridResult<PosContact>>(
        `/api/businesses/${businessId}/contacts?search=${encodeURIComponent(search)}&filter[type]=${partyType}&size=20`,
      );
      return res.data.map((c) => ({ id: c.id, label: c.name, description: c.phone ?? c.plate_number ?? undefined }));
    },
    [businessId, invoice],
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

  const grandTotal = calcGrandTotal(items) + (invoice?.type !== 'transfer' ? calcServiceTotal(services) : 0);

  async function handleSubmit() {
    if (!businessId || !invoice || !partyId) return;
    const validItems = items.filter((i) => i.product_id && Number(i.quantity) > 0);
    const validServices = invoice.type !== 'transfer' ? services.filter((s) => s.label.trim() && Number(s.amount) > 0) : [];
    if (validItems.length === 0 && validServices.length === 0) {
      setError('Minimal ada satu produk atau satu jasa');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await apiClient(`/api/businesses/${businessId}/invoices/${invoice.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          party_id: partyId,
          items: validItems.map((i) => ({
            product_id: i.product_id,
            quantity: Number(i.quantity),
            ...(i.adjusted_price ? { adjusted_price: Number(i.adjusted_price) } : {}),
          })),
          ...(invoice.type !== 'transfer'
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
      setError(err instanceof ApiError ? err.message : 'Gagal menyimpan perubahan');
    } finally {
      setSaving(false);
    }
  }

  if (businessLoading || loading) return <LoadingSpinner />;
  if (!businessId) return <NoBusinessState />;
  if (!invoice) return <p className="text-danger">{error ?? 'Faktur tidak ditemukan'}</p>;

  if (invoice.status !== 'draft') {
    return (
      <div className="space-y-4">
        <p className="text-danger">Faktur ini sudah bukan draft, tidak bisa diedit lagi.</p>
        <Button variant="flat" onPress={() => router.push(`/dashboard/invoices/${invoice.id}`)}>
          Kembali ke Detail Faktur
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Edit Faktur Draft</h1>
          <p className="font-mono text-sm text-default-500">{invoice.invoice_number}</p>
        </div>
        <div className="rounded-2xl border border-default-200 bg-default-50 px-5 py-2.5 text-right">
          <p className="text-[10px] font-bold uppercase tracking-wider text-default-500">Total Faktur</p>
          <p className="text-lg font-bold text-foreground">{formatCurrency(grandTotal)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <ReadOnlyField label="Tipe Faktur" value={INVOICE_TYPE_LABELS[invoice.type]} />
        <ReadOnlyField label={invoice.type === 'transfer' ? 'Lokasi Asal' : 'Lokasi'} value={locationLabel} />

        <AsyncSearchSelect
          label={invoice.type === 'sale' ? 'Pelanggan' : invoice.type === 'purchase' ? 'Supplier' : 'Lokasi Tujuan'}
          placeholder="Cari..."
          selectedId={partyId}
          selectedLabel={partyLabel}
          onSelect={(id, label) => {
            setPartyId(id);
            setPartyLabel(label);
          }}
          fetchOptions={fetchPartyOptions}
          onCreateNew={
            invoice.party_type !== 'outlet'
              ? (query) => {
                  setContactModalQuery(query);
                  setContactModalOpen(true);
                }
              : undefined
          }
          createNewLabel={(q) => `Tambah "${q}" sebagai ${invoice.party_type === 'customer' ? 'pelanggan' : 'supplier'} baru`}
          isRequired
        />
      </div>

      <ItemRowsEditor items={items} onChange={setItems} invoiceType={invoice.type} fetchProductOptions={fetchProductOptions} />

      {invoice.type !== 'transfer' && (
        <ServiceRowsEditor
          rows={services}
          onChange={setServices}
          mechanics={staff}
          fetchServiceOptions={fetchServiceOptions}
          businessId={businessId}
        />
      )}

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="flex gap-3">
        <Button variant="flat" onPress={() => router.push(`/dashboard/invoices/${invoice.id}`)}>
          Batal
        </Button>
        <Button color="primary" className="flex-1" isLoading={saving} onPress={handleSubmit}>
          Simpan Perubahan
        </Button>
      </div>

      {invoice.party_type !== 'outlet' && (
        <QuickAddContactModal
          isOpen={contactModalOpen}
          onClose={() => setContactModalOpen(false)}
          businessId={businessId}
          type={invoice.party_type === 'customer' ? 'customer' : 'supplier'}
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
