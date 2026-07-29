'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Select, SelectItem, Textarea } from '@heroui/react';

import { AsyncSearchSelect, type PagedFetchResult } from '../../../components/async-search-select';
import { LocationSelect } from '../../../components/location-select';
import { StickyHeader } from '../../../components/sticky-header';
import { EMPTY_ITEM_ROW, ItemRowsEditor, calcGrandTotal, type ItemRow } from '../../../components/invoice-item-rows';
import { LoadingSpinner } from '../../../components/loading-spinner';
import { NoBusinessState } from '../../../components/no-business-state';
import { QuickAddContactModal } from '../../../components/quick-add-contact-modal';
import { apiClient, ApiError } from '../../../lib/api-client';
import { formatCurrency as formatMoney } from '../../../lib/currency';
import { useBusinessContext } from '../../../context/business-context';
import {
  PAIR_TYPE_LABELS,
  type GridResult,
  type PosContact,
  type PosContactType,
  type PosInvoicePair,
  type PosInvoicePairType,
  type PosProduct,
} from '../../../lib/types';

/** `pair_type` -> tipe faktur (buat harga default item) & tipe kontak yang wajib dicari — mirror `PAIR_LEG_CONFIG` di backend. */
const PAIR_LEG_CONFIG: Record<
  PosInvoicePairType,
  { sourceType: 'sale' | 'purchase'; targetType: 'sale' | 'purchase'; contactType: PosContactType; sourceLabel: string; targetLabel: string }
> = {
  jual_tambah: {
    sourceType: 'purchase',
    targetType: 'sale',
    contactType: 'customer',
    sourceLabel: 'Barang Diterima (Trade-In dari Pelanggan)',
    targetLabel: 'Barang Diberikan (Baru)',
  },
  beli_tambah: {
    sourceType: 'sale',
    targetType: 'purchase',
    contactType: 'supplier',
    sourceLabel: 'Barang Diberikan (Barter ke Supplier)',
    targetLabel: 'Barang Diterima (Baru dari Supplier)',
  },
};

export default function NewInvoicePairPage() {
  const router = useRouter();
  const { businessId, activeMembership, loading: businessLoading } = useBusinessContext();
  function formatCurrency(value: number | string) {
    return formatMoney(value, activeMembership?.business.currency, activeMembership?.business.locale);
  }

  const [pairType, setPairType] = useState<PosInvoicePairType>('jual_tambah');
  const [locationId, setLocationId] = useState('');
  const [partyId, setPartyId] = useState('');
  const [partyLabel, setPartyLabel] = useState('');
  const [sourceItems, setSourceItems] = useState<ItemRow[]>([{ ...EMPTY_ITEM_ROW }]);
  const [targetItems, setTargetItems] = useState<ItemRow[]>([{ ...EMPTY_ITEM_ROW }]);
  const [note, setNote] = useState('');

  const [saving, setSaving] = useState<'draft' | 'submit' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [contactModalQuery, setContactModalQuery] = useState('');

  const config = PAIR_LEG_CONFIG[pairType];

  const fetchPartyOptions = useCallback(
    async (search: string, page: number): Promise<PagedFetchResult> => {
      if (!businessId) return { items: [], hasMore: false };
      const res = await apiClient<GridResult<PosContact>>(
        `/api/businesses/${businessId}/contacts?search=${encodeURIComponent(search)}&size=10&page=${page}&filter[type]=${config.contactType}`,
      );
      return {
        items: res.data.map((c) => ({ id: c.id, label: c.name, description: c.phone ?? undefined })),
        hasMore: res.meta.currentPage < res.meta.totalPages,
      };
    },
    [businessId, config.contactType],
  );

  const fetchProductOptions = useCallback(
    async (search: string, page: number): Promise<PagedFetchResult> => {
      if (!businessId) return { items: [], hasMore: false };
      const res = await apiClient<GridResult<PosProduct>>(
        `/api/businesses/${businessId}/products?search=${encodeURIComponent(search)}&size=10&page=${page}`,
      );
      return {
        items: res.data.map((p) => ({ id: p.id, label: `${p.name} (${p.sku})`, raw: p })),
        hasMore: res.meta.currentPage < res.meta.totalPages,
      };
    },
    [businessId],
  );

  const totalSource = calcGrandTotal(sourceItems);
  const totalTarget = calcGrandTotal(targetItems);
  const selisih = totalTarget - totalSource;

  function buildLegPayload(items: ItemRow[]) {
    return {
      items: items
        .filter((i) => i.product_id && Number(i.quantity) > 0)
        .map((i) => ({
          product_id: i.product_id,
          quantity: Number(i.quantity),
          ...(i.adjusted_price ? { adjusted_price: Number(i.adjusted_price) } : {}),
        })),
    };
  }

  async function handleSubmit(alsoSubmit: boolean) {
    if (!businessId || !locationId || !partyId) {
      setError('Lokasi dan pihak terkait wajib diisi');
      return;
    }
    const sourcePayload = buildLegPayload(sourceItems);
    const targetPayload = buildLegPayload(targetItems);
    if (sourcePayload.items.length === 0 || targetPayload.items.length === 0) {
      setError('Kedua sisi (diterima & diberikan) wajib minimal 1 barang');
      return;
    }

    setSaving(alsoSubmit ? 'submit' : 'draft');
    setError(null);
    try {
      const pair = await apiClient<PosInvoicePair>(`/api/businesses/${businessId}/invoice-pairs`, {
        method: 'POST',
        body: JSON.stringify({
          pair_type: pairType,
          location_id: locationId,
          party_id: partyId,
          source_leg: sourcePayload,
          target_leg: targetPayload,
          ...(note.trim() ? { note: note.trim() } : {}),
        }),
      });

      if (alsoSubmit) {
        try {
          await apiClient(`/api/businesses/${businessId}/invoice-pairs/${pair.id}/submit`, { method: 'POST' });
        } catch (err) {
          alert(
            `Pair tersimpan sebagai draft, tapi gagal disubmit otomatis: ${
              err instanceof ApiError ? err.message : 'terjadi kesalahan'
            }. Submit manual dari halaman detail.`,
          );
        }
      }

      router.push(`/dashboard/invoice-pairs/${pair.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal membuat tukar tambah');
    } finally {
      setSaving(null);
    }
  }

  if (businessLoading) return <LoadingSpinner />;
  if (!businessId) return <NoBusinessState />;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <StickyHeader>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
          <h1 className="text-lg font-bold text-foreground sm:text-2xl">Buat Tukar Tambah</h1>
          <div className="rounded-xl border border-default-200 bg-default-50 px-3 py-1.5 text-right sm:rounded-2xl sm:px-5 sm:py-2.5">
            <p className="text-[9px] font-bold uppercase tracking-wide text-default-500 sm:text-[10px] sm:tracking-wider">
              {selisih === 0 ? 'Selisih' : selisih > 0 ? 'Pihak Terkait Menambah' : 'Anda Mengembalikan'}
            </p>
            <p className={`text-sm font-bold sm:text-lg ${selisih < 0 ? 'text-danger' : 'text-foreground'}`}>
              {formatCurrency(Math.abs(selisih))}
            </p>
          </div>
        </div>
      </StickyHeader>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <Select
          label="Jenis Tukar Tambah"
          selectedKeys={[pairType]}
          onSelectionChange={(keys) => {
            setPairType(Array.from(keys)[0] as PosInvoicePairType);
            setPartyId('');
            setPartyLabel('');
          }}
        >
          {Object.entries(PAIR_TYPE_LABELS).map(([key, label]) => (
            <SelectItem key={key}>{label}</SelectItem>
          ))}
        </Select>

        <LocationSelect
          label="Lokasi"
          businessId={businessId}
          selectedId={locationId}
          onSelect={(id) => setLocationId(id)}
          isRequired
        />
      </div>

      <AsyncSearchSelect
        label={config.contactType === 'customer' ? 'Pelanggan' : 'Supplier'}
        placeholder={config.contactType === 'customer' ? 'Cari pelanggan...' : 'Cari supplier...'}
        selectedId={partyId}
        selectedLabel={partyLabel}
        onSelect={(id, label) => {
          setPartyId(id);
          setPartyLabel(label);
        }}
        fetchOptions={fetchPartyOptions}
        onCreateNew={(query) => {
          setContactModalQuery(query);
          setContactModalOpen(true);
        }}
        createNewLabel={(q) => `Tambah "${q}" sebagai ${config.contactType === 'customer' ? 'pelanggan' : 'supplier'} baru`}
        isRequired
      />

      <div className="space-y-2">
        <p className="text-sm font-medium text-foreground">{config.sourceLabel}</p>
        <ItemRowsEditor
          items={sourceItems}
          onChange={setSourceItems}
          invoiceType={config.sourceType}
          fetchProductOptions={fetchProductOptions}
        />
        <p className="text-right text-xs text-default-500">Subtotal: {formatCurrency(totalSource)}</p>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium text-foreground">{config.targetLabel}</p>
        <ItemRowsEditor
          items={targetItems}
          onChange={setTargetItems}
          invoiceType={config.targetType}
          fetchProductOptions={fetchProductOptions}
        />
        <p className="text-right text-xs text-default-500">Subtotal: {formatCurrency(totalTarget)}</p>
      </div>

      <Textarea
        label="Catatan (opsional)"
        placeholder="Catatan tambahan untuk tukar tambah ini..."
        value={note}
        onValueChange={setNote}
      />

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="flex flex-col gap-3 md:flex-row">
        <Button
          variant="flat"
          className="h-auto min-h-11 flex-1 whitespace-normal py-2.5"
          isLoading={saving === 'draft'}
          isDisabled={saving !== null}
          onPress={() => handleSubmit(false)}
        >
          Simpan sebagai Draft
        </Button>
        <Button
          color="primary"
          className="h-auto min-h-11 flex-1 whitespace-normal py-2.5"
          isLoading={saving === 'submit'}
          isDisabled={saving !== null}
          onPress={() => handleSubmit(true)}
        >
          Buat & Submit Tukar Tambah
        </Button>
      </div>

      {businessId && (
        <QuickAddContactModal
          isOpen={contactModalOpen}
          onClose={() => setContactModalOpen(false)}
          businessId={businessId}
          type={config.contactType}
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
