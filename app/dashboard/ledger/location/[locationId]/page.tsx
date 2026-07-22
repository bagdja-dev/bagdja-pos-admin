'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button, Chip } from '@heroui/react';
import { Scale } from 'lucide-react';

import { type PagedFetchResult } from '../../../../components/async-search-select';
import { DataGrid, type GridColumn } from '../../../../components/data-grid';
import { LoadingSpinner } from '../../../../components/loading-spinner';
import { NoBusinessState } from '../../../../components/no-business-state';
import { StickyHeader } from '../../../../components/sticky-header';
import { apiClient, ApiError, buildGridQueryString } from '../../../../lib/api-client';
import { useBusinessContext } from '../../../../context/business-context';
import type { GridResult, PosContact, PosContactType } from '../../../../lib/types';

const CONTACT_TYPE_LABELS: Record<PosContactType, string> = {
  customer: 'Pelanggan',
  supplier: 'Supplier',
  lender: 'Pemberi Modal',
  borrower: 'Peminjam (Kasbon)',
};

interface LedgerRow {
  partnerId: string;
  partner: PosContact | null;
  totalDebit: number;
  totalKredit: number;
  balance: number;
}

interface LocationLedgerSummary {
  locationId: string;
  locationName: string;
  totalPiutang: number;
  totalHutang: number;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(
    value,
  );
}

export default function LedgerLocationPage() {
  const params = useParams<{ locationId: string }>();
  const { businessId, loading: businessLoading } = useBusinessContext();

  const [summary, setSummary] = useState<LocationLedgerSummary | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!businessId || !params.locationId) return;
    setLoadingSummary(true);
    apiClient<LocationLedgerSummary>(`/api/businesses/${businessId}/ledger/location/${params.locationId}`)
      .then(setSummary)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Gagal memuat ringkasan toko'))
      .finally(() => setLoadingSummary(false));
  }, [businessId, params.locationId]);

  const fetchData = useCallback(
    async (gridParams: { page: number; size: number; search: string; filter: Record<string, string>; sort: string }) => {
      const qs = new URLSearchParams(buildGridQueryString(gridParams));
      qs.set('locationId', params.locationId);
      return apiClient<GridResult<LedgerRow>>(`/api/businesses/${businessId}/ledger?${qs.toString()}`);
    },
    [businessId, params.locationId],
  );

  const fetchContactFilterOptions = useCallback(
    async (search: string, page: number): Promise<PagedFetchResult> => {
      if (!businessId) return { items: [], hasMore: false };
      const res = await apiClient<GridResult<PosContact>>(
        `/api/businesses/${businessId}/contacts?search=${encodeURIComponent(search)}&size=10&page=${page}`,
      );
      return {
        items: res.data.map((c) => ({ id: c.id, label: c.name, description: CONTACT_TYPE_LABELS[c.type] })),
        hasMore: res.meta.currentPage < res.meta.totalPages,
      };
    },
    [businessId],
  );

  if (businessLoading || loadingSummary) return <LoadingSpinner />;
  if (!businessId) return <NoBusinessState />;
  if (!summary) return <p className="text-danger">{error ?? 'Toko tidak ditemukan'}</p>;

  const columns: GridColumn<LedgerRow>[] = [
    {
      key: 'actions',
      label: 'Aksi',
      width: '70px',
      render: (_v, row) => (
        <Button as={Link} href={`/dashboard/ledger/${row.partnerId}`} size="sm" variant="flat">
          Detail
        </Button>
      ),
    },
    { key: 'partner', label: 'Partner', render: (_v, row) => row.partner?.name ?? row.partnerId },
    {
      key: 'type',
      label: 'Tipe',
      render: (_v, row) =>
        row.partner?.type === 'supplier'
          ? 'Supplier'
          : row.partner?.type === 'lender'
            ? 'Pemberi Modal'
            : row.partner?.type === 'borrower'
              ? 'Peminjam (Kasbon)'
              : 'Pelanggan',
    },
    { key: 'totalDebit', label: 'Total Debit', sortable: true, render: (v) => formatCurrency(v) },
    { key: 'totalKredit', label: 'Total Kredit', sortable: true, render: (v) => formatCurrency(v) },
    {
      key: 'balance',
      label: 'Saldo',
      sortable: true,
      render: (v: number) => (
        <Chip color={v > 0 ? 'success' : v < 0 ? 'danger' : 'default'} variant="flat">
          {formatCurrency(Math.abs(v))} {v > 0 ? '(Piutang)' : v < 0 ? '(Hutang)' : ''}
        </Chip>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <StickyHeader>
        <div>
          <Button as={Link} href="/dashboard/ledger" variant="light" size="sm" className="mb-2">
            ← Kembali ke Piutang/Hutang
          </Button>
          <h1 className="text-2xl font-bold text-foreground">{summary.locationName}</h1>
          <p className="text-sm text-default-500">Kartu piutang/hutang partner khusus di toko ini.</p>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-1.5 sm:gap-3">
          <div className="rounded-xl border border-default-200 bg-default-50 px-2 py-2 sm:rounded-2xl sm:px-5 sm:py-4">
            <p className="text-[8px] font-bold uppercase tracking-wide text-default-500 sm:text-[10px] sm:tracking-wider">Total Piutang</p>
            <p className="text-xs font-bold text-success sm:text-xl">{formatCurrency(summary.totalPiutang)}</p>
          </div>
          <div className="rounded-xl border border-default-200 bg-default-50 px-2 py-2 sm:rounded-2xl sm:px-5 sm:py-4">
            <p className="text-[8px] font-bold uppercase tracking-wide text-default-500 sm:text-[10px] sm:tracking-wider">Total Hutang</p>
            <p className="text-xs font-bold text-danger sm:text-xl">{formatCurrency(summary.totalHutang)}</p>
          </div>
        </div>
      </StickyHeader>

      <DataGrid<LedgerRow>
        columns={columns}
        fetchData={fetchData}
        filterFields={[
          {
            key: 'type',
            label: 'Tipe Partner',
            type: 'select',
            options: [
              { label: 'Pelanggan', value: 'customer' },
              { label: 'Supplier', value: 'supplier' },
              { label: 'Pemberi Modal', value: 'lender' },
              { label: 'Peminjam (Kasbon)', value: 'borrower' },
            ],
          },
          {
            key: 'partnerId',
            label: 'Kontak',
            type: 'async-select',
            placeholder: 'Cari kontak...',
            fetchOptions: fetchContactFilterOptions,
          },
        ]}
        defaultSort="balance:desc"
        rowKey={(row) => row.partnerId}
        emptyState={{
          title: 'Belum ada aktivitas piutang/hutang di toko ini',
          description: 'Kartu ini terisi otomatis begitu ada faktur jual/beli yang disubmit di toko ini.',
          icon: <Scale className="h-8 w-8 text-default-400" />,
        }}
      />
    </div>
  );
}
