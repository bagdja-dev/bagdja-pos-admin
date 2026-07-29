'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button, Textarea } from '@heroui/react';

import { type PagedFetchResult } from '../../../../components/async-search-select';
import { EMPTY_ITEM_ROW, ItemRowsEditor, calcGrandTotal, type ItemRow } from '../../../../components/invoice-item-rows';
import { LoadingSpinner } from '../../../../components/loading-spinner';
import { NoBusinessState } from '../../../../components/no-business-state';
import { ReadOnlyField } from '../../../../components/read-only-field';
import { StickyHeader } from '../../../../components/sticky-header';
import { apiClient, ApiError } from '../../../../lib/api-client';
import { formatCurrency as formatMoney } from '../../../../lib/currency';
import { useBusinessContext } from '../../../../context/business-context';
import { PAIR_TYPE_LABELS, type GridResult, type PosInvoicePair, type PosProduct } from '../../../../lib/types';

function itemsToRows(items: PosInvoicePair['source']['items'], invoiceType: 'sale' | 'purchase'): ItemRow[] {
  return (items ?? []).map((it) => ({
    product_id: it.product_id,
    product_label: it.product ? `${it.product.name} (${it.product.sku})` : it.product_id,
    quantity: String(it.quantity),
    adjusted_price: it.adjusted_price,
    default_price: it.product ? (invoiceType === 'purchase' ? it.product.purchase_price : it.product.sale_price) : '',
    cost_price: it.product?.purchase_price ?? '',
  }));
}

export default function EditInvoicePairPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { businessId, activeMembership, loading: businessLoading } = useBusinessContext();
  function formatCurrency(value: number | string) {
    return formatMoney(value, activeMembership?.business.currency, activeMembership?.business.locale);
  }

  const [pair, setPair] = useState<PosInvoicePair | null>(null);
  const [sourceItems, setSourceItems] = useState<ItemRow[]>([{ ...EMPTY_ITEM_ROW }]);
  const [targetItems, setTargetItems] = useState<ItemRow[]>([{ ...EMPTY_ITEM_ROW }]);
  const [note, setNote] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!businessId || !params.id) return;
    setLoading(true);
    apiClient<PosInvoicePair>(`/api/businesses/${businessId}/invoice-pairs/${params.id}`)
      .then((p) => {
        setPair(p);
        setSourceItems(itemsToRows(p.source.items, p.source.type as 'sale' | 'purchase'));
        setTargetItems(itemsToRows(p.target.items, p.target.type as 'sale' | 'purchase'));
        setNote(p.source.note ?? '');
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Gagal memuat pair tukar tambah'))
      .finally(() => setLoading(false));
  }, [businessId, params.id]);

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

  function buildItemsPayload(items: ItemRow[]) {
    return items
      .filter((i) => i.product_id && Number(i.quantity) > 0)
      .map((i) => ({
        product_id: i.product_id,
        quantity: Number(i.quantity),
        ...(i.adjusted_price ? { adjusted_price: Number(i.adjusted_price) } : {}),
      }));
  }

  async function handleSave() {
    if (!businessId || !pair) return;
    const sourcePayload = buildItemsPayload(sourceItems);
    const targetPayload = buildItemsPayload(targetItems);
    if (sourcePayload.length === 0 || targetPayload.length === 0) {
      setError('Kedua sisi (diterima & diberikan) wajib minimal 1 barang');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await apiClient(`/api/businesses/${businessId}/invoices/${pair.source.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ items: sourcePayload, note: note.trim() || null }),
      });
      try {
        await apiClient(`/api/businesses/${businessId}/invoices/${pair.target.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ items: targetPayload, note: note.trim() || null }),
        });
      } catch (err) {
        alert(
          `Sisi "diterima" tersimpan, tapi gagal simpan sisi "diberikan": ${
            err instanceof ApiError ? err.message : 'terjadi kesalahan'
          }. Coba edit ulang untuk melengkapi.`,
        );
      }

      router.push(`/dashboard/invoice-pairs/${pair.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal menyimpan perubahan');
    } finally {
      setSaving(false);
    }
  }

  if (businessLoading || loading) return <LoadingSpinner />;
  if (!businessId) return <NoBusinessState />;
  if (!pair) return <p className="text-danger">{error ?? 'Pair tidak ditemukan'}</p>;

  if (pair.source.status !== 'draft' || pair.target.status !== 'draft') {
    return (
      <div className="space-y-4">
        <p className="text-danger">Tukar tambah ini sudah bukan draft, tidak bisa diedit lagi.</p>
        <Button variant="flat" onPress={() => router.push(`/dashboard/invoice-pairs/${pair.id}`)}>
          Kembali ke Detail
        </Button>
      </div>
    );
  }

  const totalSource = calcGrandTotal(sourceItems);
  const totalTarget = calcGrandTotal(targetItems);
  const selisih = totalTarget - totalSource;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <StickyHeader>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
          <div>
            <h1 className="text-lg font-bold text-foreground sm:text-2xl">Edit Tukar Tambah Draft</h1>
            <p className="text-sm text-default-500">{PAIR_TYPE_LABELS[pair.pair_type]}</p>
          </div>
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
        <ReadOnlyField label="Lokasi" value={pair.source.location?.name ?? ''} />
        <ReadOnlyField label="Pihak Terkait" value={pair.source.party?.name ?? ''} />
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium text-foreground">Barang Diterima (leg {pair.source.type === 'purchase' ? 'trade-in/masuk' : 'keluar'})</p>
        <ItemRowsEditor
          items={sourceItems}
          onChange={setSourceItems}
          invoiceType={pair.source.type as 'sale' | 'purchase'}
          fetchProductOptions={fetchProductOptions}
        />
        <p className="text-right text-xs text-default-500">Subtotal: {formatCurrency(totalSource)}</p>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium text-foreground">Barang Diberikan (leg {pair.target.type === 'purchase' ? 'masuk' : 'keluar'})</p>
        <ItemRowsEditor
          items={targetItems}
          onChange={setTargetItems}
          invoiceType={pair.target.type as 'sale' | 'purchase'}
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
          className="h-auto min-h-11 whitespace-normal py-2.5"
          isDisabled={saving}
          onPress={() => router.push(`/dashboard/invoice-pairs/${pair.id}`)}
        >
          Batal
        </Button>
        <Button
          color="primary"
          className="h-auto min-h-11 flex-1 whitespace-normal py-2.5"
          isLoading={saving}
          onPress={handleSave}
        >
          Simpan Perubahan
        </Button>
      </div>
    </div>
  );
}
