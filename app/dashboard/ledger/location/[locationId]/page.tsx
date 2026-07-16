'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button, Chip } from '@heroui/react';
import { Scale } from 'lucide-react';

import { DataGrid, type GridColumn } from '../../../../components/data-grid';
import { LoadingSpinner } from '../../../../components/loading-spinner';
import { NoBusinessState } from '../../../../components/no-business-state';
import { apiClient, ApiError, buildGridQueryString } from '../../../../lib/api-client';
import { useBusinessContext } from '../../../../context/business-context';
import type { GridResult, PosContact } from '../../../../lib/types';

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
        row.partner?.type === 'supplier' ? 'Supplier' : row.partner?.type === 'lender' ? 'Pemberi Modal' : 'Pelanggan',
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
      <div>
        <Button as={Link} href="/dashboard/ledger" variant="light" size="sm" className="mb-2">
          ← Kembali ke Piutang/Hutang
        </Button>
        <h1 className="text-2xl font-bold text-foreground">{summary.locationName}</h1>
        <p className="text-sm text-default-500">Kartu piutang/hutang partner khusus di toko ini.</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-default-200 bg-default-50 px-5 py-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-default-500">Total Piutang</p>
          <p className="text-xl font-bold text-success">{formatCurrency(summary.totalPiutang)}</p>
        </div>
        <div className="rounded-2xl border border-default-200 bg-default-50 px-5 py-4">
          <p className="text-[10px] font-bold uppercase tracking-wider text-default-500">Total Hutang</p>
          <p className="text-xl font-bold text-danger">{formatCurrency(summary.totalHutang)}</p>
        </div>
      </div>

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
            ],
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
