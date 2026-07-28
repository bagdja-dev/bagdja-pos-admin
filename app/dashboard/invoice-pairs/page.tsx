'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Chip } from '@heroui/react';
import { Repeat } from 'lucide-react';

import { DataGrid, type GridColumn } from '../../components/data-grid';
import { LoadingSpinner } from '../../components/loading-spinner';
import { NoBusinessState } from '../../components/no-business-state';
import { StickyHeader } from '../../components/sticky-header';
import { apiClient, buildGridQueryString } from '../../lib/api-client';
import { useBusinessContext } from '../../context/business-context';
import {
  INVOICE_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  PAIR_TYPE_LABELS,
  type GridResult,
  type PosInvoice,
  type PosInvoicePairType,
} from '../../lib/types';

interface PairRow {
  id: string;
  pair_type: PosInvoicePairType;
  created_at: string;
  source: PosInvoice;
  target: PosInvoice;
}

function InvoiceCell({ invoice }: { invoice: PosInvoice }) {
  return (
    <div>
      <p className="font-mono text-xs text-foreground">{invoice.invoice_number}</p>
      <div className="mt-0.5 flex gap-1">
        <Chip size="sm" variant="flat">{INVOICE_STATUS_LABELS[invoice.status]}</Chip>
        <Chip size="sm" variant="flat">{PAYMENT_STATUS_LABELS[invoice.payment_status]}</Chip>
      </div>
    </div>
  );
}

export default function InvoicePairsPage() {
  const router = useRouter();
  const { businessId, loading: businessLoading } = useBusinessContext();

  const fetchData = useCallback(
    async (params: { page: number; size: number; search: string; filter: Record<string, string>; sort: string }) => {
      const qs = buildGridQueryString(params);
      return apiClient<GridResult<PairRow>>(`/api/businesses/${businessId}/invoice-pairs?${qs}`);
    },
    [businessId],
  );

  if (businessLoading) return <LoadingSpinner />;
  if (!businessId) return <NoBusinessState />;

  const columns: GridColumn<PairRow>[] = [
    {
      key: 'actions',
      label: 'Aksi',
      width: '100px',
      render: (_: unknown, row: PairRow) => (
        <Button size="sm" variant="flat" onPress={() => router.push(`/dashboard/invoice-pairs/${row.id}`)}>
          Detail
        </Button>
      ),
    },
    { key: 'pair_type', label: 'Jenis', render: (v: PosInvoicePairType) => PAIR_TYPE_LABELS[v] },
    { key: 'source', label: 'Faktur Sumber', render: (_: unknown, row: PairRow) => <InvoiceCell invoice={row.source} /> },
    { key: 'target', label: 'Faktur Target', render: (_: unknown, row: PairRow) => <InvoiceCell invoice={row.target} /> },
    {
      key: 'created_at',
      label: 'Dibuat',
      sortable: true,
      render: (v: string) => new Date(v).toLocaleDateString('id-ID'),
    },
  ];

  return (
    <div className="space-y-4">
      <StickyHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Tukar Tambah</h1>
            <p className="text-sm text-default-500">Faktur jual/beli yang dipasangkan & saling di-offset otomatis.</p>
          </div>
          <Button color="primary" onPress={() => router.push('/dashboard/invoice-pairs/new')} className="w-full sm:w-auto">
            + Buat Tukar Tambah
          </Button>
        </div>
      </StickyHeader>

      <DataGrid<PairRow>
        columns={columns}
        fetchData={fetchData}
        filterFields={[
          {
            key: 'pair_type',
            label: 'Jenis',
            type: 'select',
            options: Object.entries(PAIR_TYPE_LABELS).map(([value, label]) => ({ label, value })),
          },
        ]}
        defaultSort="created_at:desc"
        rowKey={(row) => row.id}
        emptyState={{
          title: 'Belum ada tukar tambah',
          description: 'Buat transaksi tukar tambah pertama.',
          icon: <Repeat className="h-8 w-8 text-default-400" />,
        }}
      />
    </div>
  );
}
