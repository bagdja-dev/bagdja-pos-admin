'use client';

import { useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, Chip } from '@heroui/react';
import { Receipt } from 'lucide-react';

import { DataGrid, type GridColumn } from '../../components/data-grid';
import { LoadingSpinner } from '../../components/loading-spinner';
import { NoBusinessState } from '../../components/no-business-state';
import { useNewShortcut } from '../../hooks/use-new-shortcut';
import { apiClient, buildGridQueryString } from '../../lib/api-client';
import { useBusinessContext } from '../../context/business-context';
import {
  INVOICE_STATUS_LABELS,
  INVOICE_TYPE_LABELS,
  PAYMENT_STATUS_LABELS,
  type GridResult,
  type PosInvoice,
} from '../../lib/types';

function formatCurrency(value: string | number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(
    Number(value),
  );
}

const STATUS_COLOR: Record<string, 'default' | 'primary' | 'success' | 'danger'> = {
  draft: 'default',
  submitted: 'primary',
  settled: 'success',
  void: 'danger',
};

export default function InvoicesPage() {
  const router = useRouter();
  const { businessId, loading: businessLoading } = useBusinessContext();

  useNewShortcut(() => router.push('/dashboard/invoices/new'));

  const fetchData = useCallback(
    async (params: { page: number; size: number; search: string; filter: Record<string, string>; sort: string }) => {
      const qs = buildGridQueryString(params);
      return apiClient<GridResult<PosInvoice>>(`/api/businesses/${businessId}/invoices?${qs}`);
    },
    [businessId],
  );

  if (businessLoading) return <LoadingSpinner />;
  if (!businessId) return <NoBusinessState />;

  const columns: GridColumn<PosInvoice>[] = [
    { key: 'invoice_number', label: 'No. Faktur', sortable: true, render: (v) => <span className="font-mono text-xs">{v}</span> },
    {
      key: 'type',
      label: 'Tipe',
      render: (v, row) => (
        <div className="flex items-center gap-1.5">
          <span>{INVOICE_TYPE_LABELS[v as PosInvoice['type']]}</span>
          {row.ref_invoice_id && row.type !== 'transfer' && (
            <Chip size="sm" color="warning" variant="flat">
              Retur
            </Chip>
          )}
        </div>
      ),
    },
    { key: 'flow', label: 'Flow', render: (v) => (v === 'in' ? 'Masuk' : 'Keluar') },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (v) => (
        <Chip size="sm" color={STATUS_COLOR[v]} variant="flat">
          {INVOICE_STATUS_LABELS[v as PosInvoice['status']]}
        </Chip>
      ),
    },
    {
      key: 'payment_status',
      label: 'Pembayaran',
      render: (v) => PAYMENT_STATUS_LABELS[v as PosInvoice['payment_status']],
    },
    {
      key: 'outstanding',
      label: 'Sisa Pembayaran',
      render: (v: number | undefined, row) =>
        row.payment_status === 'not_applicable' || !v ? (
          <span className="text-default-400">—</span>
        ) : (
          <span className="font-medium text-danger">{formatCurrency(v)}</span>
        ),
    },
    { key: 'grand_total', label: 'Total', sortable: true, render: (v) => formatCurrency(v) },
    {
      key: 'created_at',
      label: 'Dibuat',
      sortable: true,
      render: (v) => new Date(v).toLocaleString('id-ID'),
    },
    {
      key: 'actions',
      label: 'Aksi',
      render: (_: unknown, row: PosInvoice) => (
        <Button as={Link} href={`/dashboard/invoices/${row.id}`} size="sm" variant="flat">
          Detail
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Faktur</h1>
          <p className="text-sm text-default-500">Riwayat faktur jual, beli, dan transfer.</p>
        </div>
        <Button as={Link} href="/dashboard/invoices/new" color="primary">
          + Buat Faktur
        </Button>
      </div>

      <DataGrid<PosInvoice>
        columns={columns}
        fetchData={fetchData}
        filterFields={[
          {
            key: 'type',
            label: 'Tipe',
            type: 'select',
            options: [
              { label: 'Penjualan', value: 'sale' },
              { label: 'Pembelian', value: 'purchase' },
              { label: 'Mutasi', value: 'transfer' },
            ],
          },
          {
            key: 'status',
            label: 'Status',
            type: 'select',
            options: [
              { label: 'Draft', value: 'draft' },
              { label: 'Submitted', value: 'submitted' },
              { label: 'Settled', value: 'settled' },
              { label: 'Void', value: 'void' },
            ],
          },
          {
            key: 'payment_status',
            label: 'Pembayaran',
            type: 'select',
            options: [
              { label: 'Belum Bayar', value: 'unpaid' },
              { label: 'Sebagian', value: 'partial' },
              { label: 'Lunas', value: 'paid' },
            ],
          },
        ]}
        defaultSort="created_at:desc"
        rowKey={(row) => row.id}
        emptyState={{ title: 'Belum ada faktur', description: 'Buat faktur pertama untuk mulai transaksi.', icon: <Receipt className="h-8 w-8 text-default-400" /> }}
      />
    </div>
  );
}
