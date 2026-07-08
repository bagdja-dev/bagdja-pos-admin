'use client';

import { useCallback } from 'react';
import Link from 'next/link';
import { Button, Chip } from '@heroui/react';
import { Scale } from 'lucide-react';

import { DataGrid, type GridColumn } from '../../components/data-grid';
import { LoadingSpinner } from '../../components/loading-spinner';
import { NoBusinessState } from '../../components/no-business-state';
import { apiClient, buildGridQueryString } from '../../lib/api-client';
import { useBusinessContext } from '../../context/business-context';
import type { GridResult, PosContact } from '../../lib/types';

interface LedgerRow {
  partnerId: string;
  partner: PosContact | null;
  totalDebit: number;
  totalKredit: number;
  balance: number;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(
    value,
  );
}

export default function LedgerPage() {
  const { businessId, loading: businessLoading } = useBusinessContext();

  const fetchData = useCallback(
    async (params: { page: number; size: number; search: string; filter: Record<string, string>; sort: string }) => {
      const qs = buildGridQueryString(params);
      return apiClient<GridResult<LedgerRow>>(`/api/businesses/${businessId}/ledger?${qs}`);
    },
    [businessId],
  );

  if (businessLoading) return <LoadingSpinner />;
  if (!businessId) return <NoBusinessState />;

  const columns: GridColumn<LedgerRow>[] = [
    { key: 'partner', label: 'Partner', render: (_v, row) => row.partner?.name ?? row.partnerId },
    {
      key: 'type',
      label: 'Tipe',
      render: (_v, row) => (row.partner?.type === 'supplier' ? 'Supplier' : 'Pelanggan'),
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
    {
      key: 'actions',
      label: 'Aksi',
      render: (_v, row) => (
        <Button as={Link} href={`/dashboard/ledger/${row.partnerId}`} size="sm" variant="flat">
          Detail
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Piutang / Hutang</h1>
        <p className="text-sm text-default-500">
          Saldo positif = piutang (pelanggan berhutang ke kita). Saldo negatif = hutang (kita berhutang ke supplier).
        </p>
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
            ],
          },
        ]}
        defaultSort="balance:desc"
        rowKey={(row) => row.partnerId}
        emptyState={{
          title: 'Belum ada aktivitas piutang/hutang',
          description: 'Kartu ini terisi otomatis begitu ada faktur jual/beli yang disubmit.',
          icon: <Scale className="h-8 w-8 text-default-400" />,
        }}
      />
    </div>
  );
}
