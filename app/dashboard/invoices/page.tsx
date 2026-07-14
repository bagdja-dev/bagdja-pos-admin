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

/** Kartu faktur untuk mode mobile — seluruh kartu bisa ditekan langsung ke halaman detail. */
function renderInvoiceCard(row: PosInvoice) {
  return (
    <Link
      href={`/dashboard/invoices/${row.id}`}
      className="block space-y-3 rounded-xl border border-default-200 bg-white p-4 transition-colors active:bg-default-50"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-mono text-xs text-default-500">{row.invoice_number}</p>
          <div className="mt-1 flex items-center gap-1.5">
            <span className="text-sm font-medium text-foreground">{INVOICE_TYPE_LABELS[row.type]}</span>
            {row.ref_invoice_id && row.type !== 'transfer' && (
              <Chip size="sm" color="warning" variant="flat">
                Retur
              </Chip>
            )}
          </div>
        </div>
        <Chip size="sm" color={STATUS_COLOR[row.status]} variant="flat">
          {INVOICE_STATUS_LABELS[row.status]}
        </Chip>
      </div>

      <div className="text-sm text-default-500">
        {row.flow === 'in' ? 'Masuk' : 'Keluar'} · {row.location?.name ?? '—'}
      </div>
      <p className="text-sm text-foreground">{row.party?.name ?? '—'}</p>

      <div className="flex items-end justify-between border-t border-default-100 pt-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-default-400">Total</p>
          <p className="text-base font-bold text-foreground">{formatCurrency(row.grand_total)}</p>
        </div>
        {row.payment_status !== 'not_applicable' && row.outstanding ? (
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase tracking-wider text-default-400">Sisa Bayar</p>
            <p className="text-sm font-medium text-danger">{formatCurrency(row.outstanding)}</p>
          </div>
        ) : (
          <p className="text-xs text-default-400">{PAYMENT_STATUS_LABELS[row.payment_status]}</p>
        )}
      </div>

      <p className="text-right text-xs text-default-400">{new Date(row.created_at).toLocaleString('id-ID')}</p>
    </Link>
  );
}

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
    {
      key: 'actions',
      label: 'Aksi',
      width: '70px',
      render: (_: unknown, row: PosInvoice) => (
        <Button as={Link} href={`/dashboard/invoices/${row.id}`} size="sm" variant="flat">
          Detail
        </Button>
      ),
    },
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
      key: 'location',
      label: 'Lokasi',
      render: (_: unknown, row: PosInvoice) => row.location?.name ?? '—',
    },
    {
      key: 'party',
      label: 'Pihak Terkait',
      render: (_: unknown, row: PosInvoice) => row.party?.name ?? '—',
    },
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
              { label: 'Modal', value: 'capital' },
              { label: 'Penarikan', value: 'withdrawal' },
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
          {
            key: 'party',
            label: 'Pihak Terkait',
            type: 'text',
            placeholder: 'Cari nama pelanggan/supplier/lokasi tujuan...',
          },
        ]}
        defaultSort="created_at:desc"
        rowKey={(row) => row.id}
        emptyState={{ title: 'Belum ada faktur', description: 'Buat faktur pertama untuk mulai transaksi.', icon: <Receipt className="h-8 w-8 text-default-400" /> }}
        renderCard={renderInvoiceCard}
      />
    </div>
  );
}
