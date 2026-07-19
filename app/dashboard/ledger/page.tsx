'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Button, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from '@heroui/react';
import { Scale } from 'lucide-react';

import { LoadingSpinner } from '../../components/loading-spinner';
import { NoBusinessState } from '../../components/no-business-state';
import { StickyHeader } from '../../components/sticky-header';
import { apiClient, ApiError } from '../../lib/api-client';
import { useBusinessContext } from '../../context/business-context';

interface LedgerTotals {
  totalPiutang: number;
  totalHutang: number;
}

interface LedgerByLocation extends LedgerTotals {
  locationId: string;
  locationName: string;
}

interface LedgerSummary {
  total: LedgerTotals;
  byLocation: LedgerByLocation[];
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(
    value,
  );
}

export default function LedgerPage() {
  const { businessId, loading: businessLoading } = useBusinessContext();

  const [summary, setSummary] = useState<LedgerSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!businessId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient<LedgerSummary>(`/api/businesses/${businessId}/ledger/summary`);
      setSummary(res);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal memuat Piutang/Hutang');
    } finally {
      setLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (businessLoading) return <LoadingSpinner />;
  if (!businessId) return <NoBusinessState />;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <StickyHeader>
        <h1 className="text-2xl font-bold text-foreground">Piutang / Hutang</h1>
        <p className="text-sm text-default-500">
          Piutang = pelanggan berhutang ke kita. Hutang = kita berhutang ke supplier. Dikelompokkan per toko —
          klik Detail untuk lihat kartu per partner di toko itu.
        </p>
      </StickyHeader>

      {error && <p className="text-sm text-danger">{error}</p>}

      {loading ? (
        <LoadingSpinner />
      ) : summary ? (
        <div className="space-y-4">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-default-500">
              Total Semua Toko
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-default-200 bg-default-50 px-5 py-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-default-500">Total Piutang</p>
                <p className="text-xl font-bold text-success">{formatCurrency(summary.total.totalPiutang)}</p>
              </div>
              <div className="rounded-2xl border border-default-200 bg-default-50 px-5 py-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-default-500">Total Hutang</p>
                <p className="text-xl font-bold text-danger">{formatCurrency(summary.total.totalHutang)}</p>
              </div>
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-default-500">Per Toko</p>
            <Table aria-label="Piutang/hutang per toko">
              <TableHeader>
                <TableColumn>TOKO</TableColumn>
                <TableColumn>PIUTANG</TableColumn>
                <TableColumn>HUTANG</TableColumn>
                <TableColumn>AKSI</TableColumn>
              </TableHeader>
              <TableBody emptyContent="Belum ada aktivitas piutang/hutang pada toko manapun">
                {summary.byLocation.map((row) => (
                  <TableRow key={row.locationId}>
                    <TableCell>{row.locationName}</TableCell>
                    <TableCell className="text-success">{formatCurrency(row.totalPiutang)}</TableCell>
                    <TableCell className="text-danger">{formatCurrency(row.totalHutang)}</TableCell>
                    <TableCell>
                      <Button as={Link} href={`/dashboard/ledger/location/${row.locationId}`} size="sm" variant="flat">
                        Detail
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      ) : (
        <div className="flex min-h-[160px] flex-col items-center justify-center rounded-xl border border-dashed border-default-200 bg-default-50 p-8 text-center">
          <Scale className="mb-3 h-8 w-8 text-default-400" />
          <p className="text-sm text-default-500">Belum ada data piutang/hutang.</p>
        </div>
      )}
    </div>
  );
}
