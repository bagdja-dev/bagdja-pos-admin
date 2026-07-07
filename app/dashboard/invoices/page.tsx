'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Button,
  Chip,
  Select,
  SelectItem,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from '@heroui/react';

import { LoadingSpinner } from '../../components/loading-spinner';
import { NoBusinessState } from '../../components/no-business-state';
import { apiClient, ApiError } from '../../lib/api-client';
import { useBusinessContext } from '../../context/business-context';
import { INVOICE_STATUS_LABELS, INVOICE_TYPE_LABELS, PAYMENT_STATUS_LABELS, type PosInvoice } from '../../lib/types';

function formatCurrency(value: string) {
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
  const { businessId, loading: businessLoading } = useBusinessContext();
  const [invoices, setInvoices] = useState<PosInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!businessId) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (typeFilter !== 'all') params.set('type', typeFilter);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      const qs = params.toString();
      const data = await apiClient<PosInvoice[]>(
        `/api/businesses/${businessId}/invoices${qs ? `?${qs}` : ''}`,
      );
      setInvoices(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal memuat faktur');
    } finally {
      setLoading(false);
    }
  }, [businessId, typeFilter, statusFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  if (businessLoading) return <LoadingSpinner />;
  if (!businessId) return <NoBusinessState />;

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

      <div className="flex gap-3">
        <Select
          label="Tipe"
          className="w-48"
          selectedKeys={[typeFilter]}
          onSelectionChange={(keys) => setTypeFilter(Array.from(keys)[0] as string)}
        >
          <SelectItem key="all">Semua Tipe</SelectItem>
          <SelectItem key="sale">Penjualan</SelectItem>
          <SelectItem key="purchase">Pembelian</SelectItem>
          <SelectItem key="transfer">Mutasi</SelectItem>
        </Select>
        <Select
          label="Status"
          className="w-48"
          selectedKeys={[statusFilter]}
          onSelectionChange={(keys) => setStatusFilter(Array.from(keys)[0] as string)}
        >
          <SelectItem key="all">Semua Status</SelectItem>
          <SelectItem key="draft">Draft</SelectItem>
          <SelectItem key="submitted">Submitted</SelectItem>
          <SelectItem key="settled">Settled</SelectItem>
          <SelectItem key="void">Void</SelectItem>
        </Select>
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      {loading ? (
        <LoadingSpinner />
      ) : (
        <Table aria-label="Daftar faktur">
          <TableHeader>
            <TableColumn>TIPE</TableColumn>
            <TableColumn>FLOW</TableColumn>
            <TableColumn>STATUS</TableColumn>
            <TableColumn>PEMBAYARAN</TableColumn>
            <TableColumn>TOTAL</TableColumn>
            <TableColumn>DIBUAT</TableColumn>
            <TableColumn>AKSI</TableColumn>
          </TableHeader>
          <TableBody emptyContent="Belum ada faktur">
            {invoices.map((inv) => (
              <TableRow key={inv.id}>
                <TableCell>{INVOICE_TYPE_LABELS[inv.type]}</TableCell>
                <TableCell>{inv.flow === 'in' ? 'Masuk' : 'Keluar'}</TableCell>
                <TableCell>
                  <Chip size="sm" color={STATUS_COLOR[inv.status]} variant="flat">
                    {INVOICE_STATUS_LABELS[inv.status]}
                  </Chip>
                </TableCell>
                <TableCell>{PAYMENT_STATUS_LABELS[inv.payment_status]}</TableCell>
                <TableCell>{formatCurrency(inv.grand_total)}</TableCell>
                <TableCell>{new Date(inv.created_at).toLocaleString('id-ID')}</TableCell>
                <TableCell>
                  <Button as={Link} href={`/dashboard/invoices/${inv.id}`} size="sm" variant="flat">
                    Detail
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
