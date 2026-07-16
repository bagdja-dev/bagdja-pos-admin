'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button, Input } from '@heroui/react';
import { Wallet } from 'lucide-react';

import { DataGrid, type GridColumn } from '../../../components/data-grid';
import { LoadingSpinner } from '../../../components/loading-spinner';
import { NoBusinessState } from '../../../components/no-business-state';
import { apiClient, ApiError, buildGridQueryString } from '../../../lib/api-client';
import { useBusinessContext } from '../../../context/business-context';
import type { GridResult, PosPaymentLedger } from '../../../lib/types';

interface LocationCashSummary {
  locationId: string;
  locationName: string;
  cashIn: number;
  cashOut: number;
  net: number;
}

function formatCurrency(value: number | string) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(
    Number(value),
  );
}

function entryTypeLabel(entryType: PosPaymentLedger['entry_type']) {
  switch (entryType) {
    case 'invoice_issued':
      return 'Tagihan';
    case 'adjustment':
      return 'Penyesuaian (Non-Tunai)';
    case 'charge':
      return 'Bunga';
    default:
      return 'Pembayaran';
  }
}

export default function CashSummaryLocationDetailPage() {
  const params = useParams<{ locationId: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { businessId, loading: businessLoading } = useBusinessContext();

  const [from, setFrom] = useState(searchParams.get('from') ?? '');
  const [to, setTo] = useState(searchParams.get('to') ?? '');
  const [summary, setSummary] = useState<LocationCashSummary | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const loadSummary = useCallback(async () => {
    if (!businessId || !params.locationId) return;
    setLoadingSummary(true);
    setError(null);
    try {
      const qs = new URLSearchParams();
      if (from) qs.set('from', from);
      if (to) qs.set('to', to);
      const res = await apiClient<LocationCashSummary>(
        `/api/businesses/${businessId}/cash-summary/${params.locationId}?${qs.toString()}`,
      );
      setSummary(res);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal memuat arus kas lokasi ini');
    } finally {
      setLoadingSummary(false);
    }
  }, [businessId, params.locationId, from, to]);

  useEffect(() => {
    void loadSummary();
  }, [loadSummary]);

  function applyFilter() {
    const qs = new URLSearchParams();
    if (from) qs.set('from', from);
    if (to) qs.set('to', to);
    router.replace(`/dashboard/cash-summary/${params.locationId}?${qs.toString()}`);
    setRefreshTrigger((t) => t + 1);
    void loadSummary();
  }

  const fetchEntries = useCallback(
    async (gridParams: { page: number; size: number; search: string; filter: Record<string, string>; sort: string }) => {
      const qs = new URLSearchParams(buildGridQueryString(gridParams));
      if (from) qs.set('from', from);
      if (to) qs.set('to', to);
      return apiClient<GridResult<PosPaymentLedger>>(
        `/api/businesses/${businessId}/cash-summary/${params.locationId}/entries?${qs.toString()}`,
      );
    },
    [businessId, params.locationId, from, to],
  );

  if (businessLoading || loadingSummary) return <LoadingSpinner />;
  if (!businessId) return <NoBusinessState />;
  if (!summary) return <p className="text-danger">{error ?? 'Lokasi tidak ditemukan'}</p>;

  const columns: GridColumn<PosPaymentLedger>[] = [
    {
      key: 'created_at',
      label: 'Tanggal',
      sortable: true,
      render: (v) => new Date(v).toLocaleString('id-ID'),
    },
    {
      key: 'invoice_id',
      label: 'Faktur',
      render: (_v, row) => (
        <Button as={Link} href={`/dashboard/invoices/${row.invoice_id}`} size="sm" variant="flat" className="font-mono">
          {row.invoice?.invoice_number ?? 'Lihat'}
        </Button>
      ),
    },
    { key: 'entry_type', label: 'Tipe', render: (v) => entryTypeLabel(v) },
    { key: 'partner_id', label: 'Kontak', render: (_v, row) => row.partner?.name ?? '—' },
    { key: 'payment_method', label: 'Metode', render: (v) => v ?? '—' },
    { key: 'debit', label: 'Kas Keluar', sortable: true, render: (v) => formatCurrency(v) },
    { key: 'kredit', label: 'Kas Masuk', sortable: true, render: (v) => formatCurrency(v) },
    { key: 'note', label: 'Catatan', render: (v) => v ?? '—' },
  ];

  return (
    <div className="space-y-4">
      <div>
        <Button as={Link} href="/dashboard/cash-summary" variant="light" size="sm" className="mb-2">
          ← Kembali ke Kas
        </Button>
        <h1 className="text-2xl font-bold text-foreground">{summary.locationName}</h1>
        <p className="text-sm text-default-500">Arus kas riil dari faktur di lokasi ini (bukan piutang/hutang).</p>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <Input type="date" label="Dari Tanggal" className="w-48" value={from} onValueChange={setFrom} />
        <Input type="date" label="Sampai Tanggal" className="w-48" value={to} onValueChange={setTo} />
        <Button variant="flat" onPress={applyFilter}>
          Terapkan
        </Button>
        {(from || to) && (
          <Button
            variant="light"
            onPress={() => {
              setFrom('');
              setTo('');
              router.replace(`/dashboard/cash-summary/${params.locationId}`);
              setRefreshTrigger((t) => t + 1);
            }}
          >
            Reset
          </Button>
        )}
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-default-200 bg-default-50 px-5 py-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-default-500">Kas Masuk</p>
          <p className="text-xl font-bold text-success">{formatCurrency(summary.cashIn)}</p>
        </div>
        <div className="rounded-2xl border border-default-200 bg-default-50 px-5 py-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-default-500">Kas Keluar</p>
          <p className="text-xl font-bold text-danger">{formatCurrency(summary.cashOut)}</p>
        </div>
        <div className="rounded-2xl border border-default-200 bg-default-50 px-5 py-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-default-500">Selisih</p>
          <p className={`text-xl font-bold ${summary.net >= 0 ? 'text-success' : 'text-danger'}`}>
            {formatCurrency(summary.net)}
          </p>
        </div>
      </div>

      <DataGrid<PosPaymentLedger>
        columns={columns}
        fetchData={fetchEntries}
        defaultSort="created_at:desc"
        refreshTrigger={refreshTrigger}
        rowKey={(row) => row.id}
        emptyState={{
          title: 'Belum ada pergerakan kas',
          description: 'Kartu ini terisi otomatis begitu ada pembayaran/bunga yang dicatat di lokasi ini.',
          icon: <Wallet className="h-8 w-8 text-default-400" />,
        }}
      />
    </div>
  );
}
