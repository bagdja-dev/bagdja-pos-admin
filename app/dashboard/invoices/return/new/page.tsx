'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, Card, CardBody, CardHeader, Chip, Input } from '@heroui/react';

import { AsyncSearchSelect, type PagedFetchResult } from '../../../../components/async-search-select';
import { LoadingSpinner } from '../../../../components/loading-spinner';
import { NoBusinessState } from '../../../../components/no-business-state';
import { StickyHeader } from '../../../../components/sticky-header';
import { apiClient } from '../../../../lib/api-client';
import { formatCurrency as formatMoney } from '../../../../lib/currency';
import { useBusinessContext } from '../../../../context/business-context';
import {
  INVOICE_STATUS_LABELS,
  INVOICE_TYPE_LABELS,
  type GridResult,
  type PosInvoice,
} from '../../../../lib/types';

const STATUS_COLOR: Record<string, 'default' | 'primary' | 'success' | 'danger'> = {
  draft: 'default',
  submitted: 'primary',
  settled: 'success',
  void: 'danger',
};

type InvoiceSearchResult = PosInvoice;

function ReturnableInvoiceCard({
  invoice,
  currency,
  locale,
  onCreateReturn,
  loadingId,
}: {
  invoice: InvoiceSearchResult;
  currency?: string;
  locale?: string;
  onCreateReturn: (id: string) => void;
  loadingId: string | null;
}) {
  const isReturn = !!invoice.ref_invoice_id && invoice.type !== 'transfer';

  return (
    <div className="space-y-3 rounded-xl border border-default-200 bg-white p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-mono text-xs text-default-500">{invoice.invoice_number}</p>
          <div className="mt-1 flex items-center gap-1.5 flex-wrap">
            <span className="text-sm font-medium text-foreground">
              {INVOICE_TYPE_LABELS[invoice.type]}
            </span>
            <Chip size="sm" color={STATUS_COLOR[invoice.status]} variant="flat">
              {INVOICE_STATUS_LABELS[invoice.status]}
            </Chip>
            {isReturn && (
              <Chip size="sm" color="warning" variant="flat">
                Sudah Retur
              </Chip>
            )}
          </div>
        </div>
        <Button
          as={Link}
          href={`/dashboard/invoices/${invoice.id}`}
          size="sm"
          variant="light"
        >
          Detail
        </Button>
      </div>

      <div className="text-sm text-default-500">
        {invoice.flow === 'in' ? 'Masuk' : 'Keluar'} · {invoice.location?.name ?? '—'}
      </div>
      <p className="text-sm text-foreground">{invoice.party?.name ?? '—'}</p>

      <div className="flex items-center justify-between border-t border-default-100 pt-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-default-400">Total</p>
          <p className="text-base font-bold text-foreground">
            {formatMoney(invoice.grand_total, currency, locale)}
          </p>
        </div>
        <Button
          color="primary"
          size="sm"
          isLoading={loadingId === invoice.id}
          isDisabled={loadingId !== null || isReturn}
          onPress={() => onCreateReturn(invoice.id)}
        >
          {isReturn ? 'Sudah Diretur' : 'Buat Retur'}
        </Button>
      </div>

      <p className="text-right text-xs text-default-400">
        {new Date(invoice.created_at).toLocaleString('id-ID')}
      </p>
    </div>
  );
}

export default function NewReturnPage() {
  const router = useRouter();
  const { businessId, activeMembership, loading: businessLoading } = useBusinessContext();
  function formatCurrency(value: number | string) {
    return formatMoney(value, activeMembership?.business.currency, activeMembership?.business.locale);
  }

  const [searchMode, setSearchMode] = useState<'async' | 'number'>('async');
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [searchResults, setSearchResults] = useState<InvoiceSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [noResults, setNoResults] = useState(false);
  const [submittingReturnId, setSubmittingReturnId] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), 350);
    return () => clearTimeout(t);
  }, [query]);

  const performSearchByNumber = useCallback(async () => {
    if (!businessId || !debouncedQuery) {
      setSearchResults([]);
      setNoResults(false);
      return;
    }
    setSearching(true);
    setNoResults(false);
    try {
      const res = await apiClient<GridResult<InvoiceSearchResult>>(
        `/api/businesses/${businessId}/invoices?search=${encodeURIComponent(debouncedQuery)}&size=20&page=1`,
      );
      const matches = res.data.filter((inv) =>
        inv.invoice_number.toLowerCase().includes(debouncedQuery.toLowerCase()),
      );
      setSearchResults(matches.length > 0 ? matches : res.data);
      setNoResults(res.data.length === 0 || (matches.length === 0 && res.data.length === 0));
    } catch {
      setSearchResults([]);
      setNoResults(true);
    } finally {
      setSearching(false);
    }
  }, [businessId, debouncedQuery]);

  useEffect(() => {
    if (searchMode === 'number') {
      void performSearchByNumber();
    }
  }, [searchMode, performSearchByNumber]);

  const fetchInvoiceOptions = useCallback(
    async (search: string, page: number): Promise<PagedFetchResult> => {
      if (!businessId) return { items: [], hasMore: false };
      const res = await apiClient<GridResult<InvoiceSearchResult>>(
        `/api/businesses/${businessId}/invoices?search=${encodeURIComponent(search)}&size=10&page=${page}`,
      );
      return {
        items: res.data.map((inv) => ({
          id: inv.id,
          label: `${inv.invoice_number} — ${inv.party?.name ?? '—'}`,
          description:
            `${INVOICE_TYPE_LABELS[inv.type]} · ${formatMoney(inv.grand_total, activeMembership?.business.currency, activeMembership?.business.locale)}` +
            (inv.ref_invoice_id && inv.type !== 'transfer' ? ' (Sudah Retur)' : ''),
          raw: inv,
        })),
        hasMore: res.meta.currentPage < res.meta.totalPages,
      };
    },
    [businessId, activeMembership],
  );

  async function handleCreateReturn(invoiceId: string) {
    if (!businessId) return;
    setSubmittingReturnId(invoiceId);
    try {
      const res = await apiClient<PosInvoice>(`/api/businesses/${businessId}/invoices/${invoiceId}/return`, {
        method: 'POST',
        body: JSON.stringify({}),
      });
      router.push(`/dashboard/invoices/${res.id}/edit`);
    } catch (err) {
      alert(
        'Gagal membuat retur. Pastikan endpoint return tersedia di backend, atau buat retur manual dari halaman detail faktur.',
      );
      router.push(`/dashboard/invoices/${invoiceId}`);
    } finally {
      setSubmittingReturnId(null);
    }
  }

  if (businessLoading) return <LoadingSpinner />;
  if (!businessId) return <NoBusinessState />;

  const canCreateFromId = submittingReturnId === null;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <StickyHeader>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
          <div>
            <h1 className="text-lg font-bold text-foreground sm:text-2xl">Buat Retur Baru</h1>
            <p className="text-xs sm:text-sm text-default-500">
              Cari faktur asal yang akan diretur, lalu klik "Buat Retur".
            </p>
          </div>
          <Button
            as={Link}
            href="/dashboard/invoices"
            variant="flat"
            startContent={
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            }
          >
            Lihat Semua Faktur
          </Button>
        </div>
      </StickyHeader>

      <Card shadow="sm">
        <CardHeader className="flex flex-col gap-2 pb-0 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm font-semibold text-default-700">Cari Faktur Asal</div>
          <div className="flex gap-1 self-end">
            <Button
              size="sm"
              variant={searchMode === 'async' ? 'solid' : 'flat'}
              color={searchMode === 'async' ? 'primary' : 'default'}
              onPress={() => setSearchMode('async')}
            >
              Cari Nama / Nomor
            </Button>
            <Button
              size="sm"
              variant={searchMode === 'number' ? 'solid' : 'flat'}
              color={searchMode === 'number' ? 'primary' : 'default'}
              onPress={() => setSearchMode('number')}
            >
              Berdasarkan Nomor
            </Button>
          </div>
        </CardHeader>
        <CardBody className="space-y-4">
          {searchMode === 'async' ? (
            <div className="space-y-2">
              <AsyncSearchSelect
                label="Pilih Faktur (Cari berdasarkan nama pihak / nomor faktur / total)"
                placeholder="Ketik untuk mencari..."
                selectedId=""
                selectedLabel=""
                fetchOptions={fetchInvoiceOptions}
                onSelect={(id, _label, raw) => {
                  if (raw) {
                    setSearchResults([raw as InvoiceSearchResult]);
                    setNoResults(false);
                  }
                }}
              />
            </div>
          ) : (
            <div className="space-y-2">
              <Input
                label="Nomor Faktur"
                placeholder="Mis. JUAL-000123 atau BELI..."
                value={query}
                onValueChange={setQuery}
                isClearable
                startContent={
                  <svg className="h-4 w-4 text-default-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                    />
                  </svg>
                }
              />
              {searching && (
                <p className="text-xs text-default-500">Mencari...</p>
              )}
              {!searching && noResults && debouncedQuery && (
                <p className="text-xs text-danger">Tidak ada faktur yang cocok dengan "{debouncedQuery}".</p>
              )}
            </div>
          )}
        </CardBody>
      </Card>

      {searchResults.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-default-600">Hasil Pencarian ({searchResults.length})</p>
          {searchResults.map((inv) => (
            <ReturnableInvoiceCard
              key={inv.id}
              invoice={inv}
              currency={activeMembership?.business.currency}
              locale={activeMembership?.business.locale}
              onCreateReturn={handleCreateReturn}
              loadingId={submittingReturnId}
            />
          ))}
        </div>
      )}

      <div className="rounded-xl border border-dashed border-default-200 p-4 text-xs sm:text-sm text-default-500">
        <p className="font-semibold text-default-700 mb-1">Catatan:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Retur akan otomatis mereferensikan faktur asal (ref_invoice_id) dan membalik flow stok.</li>
          <li>Faktur yang sudah diretur sebelumnya diberi label "Sudah Retur" dan tombol dinonaktifkan.</li>
          <li>Jika endpoint return belum tersedia di backend, Anda akan dialihkan ke halaman detail faktur untuk dibuat manual.</li>
        </ul>
      </div>
    </div>
  );
}
