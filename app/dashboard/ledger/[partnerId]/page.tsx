'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button, Chip } from '@heroui/react';
import { Scale } from 'lucide-react';

import { DataGrid, type GridColumn } from '../../../components/data-grid';
import { LoadingSpinner } from '../../../components/loading-spinner';
import { NoBusinessState } from '../../../components/no-business-state';
import { apiClient, ApiError, buildGridQueryString } from '../../../lib/api-client';
import { useBusinessContext } from '../../../context/business-context';
import type { GridResult, PosContact, PosPaymentLedger } from '../../../lib/types';

interface PartnerSummary {
  partner: PosContact;
  totalDebit: number;
  totalKredit: number;
  balance: number;
}

function formatCurrency(value: number | string) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(
    Number(value),
  );
}

export default function LedgerPartnerDetailPage() {
  const params = useParams<{ partnerId: string }>();
  const { businessId, loading: businessLoading } = useBusinessContext();

  const [summary, setSummary] = useState<PartnerSummary | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!businessId || !params.partnerId) return;
    setLoadingSummary(true);
    apiClient<PartnerSummary>(`/api/businesses/${businessId}/ledger/${params.partnerId}`)
      .then(setSummary)
      .catch((err) => setError(err instanceof ApiError ? err.message : 'Gagal memuat ringkasan partner'))
      .finally(() => setLoadingSummary(false));
  }, [businessId, params.partnerId]);

  const fetchEntries = useCallback(
    async (gridParams: { page: number; size: number; search: string; filter: Record<string, string>; sort: string }) => {
      const qs = buildGridQueryString(gridParams);
      return apiClient<GridResult<PosPaymentLedger>>(
        `/api/businesses/${businessId}/ledger/${params.partnerId}/entries?${qs}`,
      );
    },
    [businessId, params.partnerId],
  );

  if (businessLoading || loadingSummary) return <LoadingSpinner />;
  if (!businessId) return <NoBusinessState />;
  if (!summary) return <p className="text-danger">{error ?? 'Partner tidak ditemukan'}</p>;

  const { partner, balance } = summary;

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
    {
      key: 'entry_type',
      label: 'Tipe',
      render: (v) =>
        v === 'invoice_issued'
          ? 'Tagihan'
          : v === 'adjustment'
            ? 'Penyesuaian (Non-Tunai)'
            : v === 'charge'
              ? 'Bunga'
              : 'Pembayaran',
    },
    { key: 'payment_method', label: 'Metode', render: (v) => v ?? '—' },
    { key: 'debit', label: 'Debit', sortable: true, render: (v) => formatCurrency(v) },
    { key: 'kredit', label: 'Kredit', sortable: true, render: (v) => formatCurrency(v) },
    { key: 'note', label: 'Catatan', render: (v) => v ?? '—' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{partner.name}</h1>
          <p className="text-sm text-default-500">
            {partner.type === 'supplier' ? 'Supplier' : partner.type === 'lender' ? 'Pemberi Modal' : 'Pelanggan'}
            {partner.phone ? ` · ${partner.phone}` : ''}
            {partner.plate_number ? ` · ${partner.plate_number}` : ''}
          </p>
        </div>
        <Chip size="lg" color={balance > 0 ? 'success' : balance < 0 ? 'danger' : 'default'} variant="flat">
          {formatCurrency(Math.abs(balance))} {balance > 0 ? '(Piutang)' : balance < 0 ? '(Hutang)' : '(Lunas)'}
        </Chip>
      </div>

      <DataGrid<PosPaymentLedger>
        columns={columns}
        fetchData={fetchEntries}
        defaultSort="created_at:asc"
        rowKey={(row) => row.id}
        emptyState={{
          title: 'Belum ada histori ledger',
          description: 'Kartu ini terisi otomatis begitu ada faktur jual/beli yang disubmit.',
          icon: <Scale className="h-8 w-8 text-default-400" />,
        }}
      />
    </div>
  );
}
