'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Button, Input, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from '@heroui/react';
import { Wallet } from 'lucide-react';

import { LoadingSpinner } from '../../components/loading-spinner';
import { NoBusinessState } from '../../components/no-business-state';
import { PageDescription } from '../../components/page-description';
import { StickyHeader } from '../../components/sticky-header';
import { ViewModeToggle } from '../../components/view-mode-toggle';
import { apiClient, ApiError } from '../../lib/api-client';
import { useBusinessContext } from '../../context/business-context';
import { useViewMode } from '../../hooks/use-view-mode';

interface CashTotals {
  cashIn: number;
  cashOut: number;
  net: number;
}

interface CashByLocation extends CashTotals {
  locationId: string;
  locationName: string;
}

interface CashSummary {
  total: CashTotals;
  byLocation: CashByLocation[];
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(
    value,
  );
}

export default function CashSummaryPage() {
  const { businessId, loading: businessLoading } = useBusinessContext();
  const { mode: viewMode, setMode: setViewMode, showCards } = useViewMode('view-mode:cash-summary');

  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [summary, setSummary] = useState<CashSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!businessId) return;
    setLoading(true);
    setError(null);
    try {
      const qs = new URLSearchParams();
      if (from) qs.set('from', from);
      if (to) qs.set('to', to);
      const res = await apiClient<CashSummary>(`/api/businesses/${businessId}/cash-summary?${qs.toString()}`);
      setSummary(res);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal memuat Kas Toko');
    } finally {
      setLoading(false);
    }
  }, [businessId, from, to]);

  useEffect(() => {
    void load();
  }, [load]);

  if (businessLoading) return <LoadingSpinner />;
  if (!businessId) return <NoBusinessState />;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <StickyHeader className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Kas</h1>
          <PageDescription>
            Kas masuk/keluar riil dari faktur (bukan piutang/hutang) — dihitung dari pembayaran yang benar-benar
            diterima/dikeluarkan, termasuk modal/pinjaman yang masuk saat submit.
          </PageDescription>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <Input type="date" label="Dari Tanggal" className="w-48" value={from} onValueChange={setFrom} />
          <Input type="date" label="Sampai Tanggal" className="w-48" value={to} onValueChange={setTo} />
          <Button variant="flat" onPress={load}>
            Terapkan
          </Button>
          {(from || to) && (
            <Button
              variant="light"
              onPress={() => {
                setFrom('');
                setTo('');
              }}
            >
              Reset
            </Button>
          )}
        </div>
      </StickyHeader>

      {error && <p className="text-sm text-danger">{error}</p>}

      {loading ? (
        <LoadingSpinner />
      ) : summary ? (
        <div className="space-y-4">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-default-500">
              Total Semua Lokasi
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-default-200 bg-default-50 px-5 py-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-default-500">Kas Masuk</p>
                <p className="text-xl font-bold text-success">{formatCurrency(summary.total.cashIn)}</p>
              </div>
              <div className="rounded-2xl border border-default-200 bg-default-50 px-5 py-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-default-500">Kas Keluar</p>
                <p className="text-xl font-bold text-danger">{formatCurrency(summary.total.cashOut)}</p>
              </div>
              <div className="rounded-2xl border border-default-200 bg-default-50 px-5 py-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-default-500">Selisih</p>
                <p className={`text-xl font-bold ${summary.total.net >= 0 ? 'text-success' : 'text-danger'}`}>
                  {formatCurrency(summary.total.net)}
                </p>
              </div>
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-default-500">Per Lokasi</p>
              <ViewModeToggle mode={viewMode} onChange={setViewMode} />
            </div>

            {summary.byLocation.length === 0 ? (
              <p className="rounded-xl border border-dashed border-default-200 bg-default-50 p-6 text-center text-sm text-default-500">
                Belum ada pergerakan kas pada periode ini
              </p>
            ) : showCards ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {summary.byLocation.map((row) => {
                  const detailQs = new URLSearchParams();
                  if (from) detailQs.set('from', from);
                  if (to) detailQs.set('to', to);
                  return (
                    <div key={row.locationId} className="rounded-2xl border border-default-200 bg-default-50 p-4">
                      <p className="font-semibold text-foreground">{row.locationName}</p>
                      <div className="mt-3 space-y-1.5 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="text-default-500">Kas Masuk</span>
                          <span className="font-semibold text-success">{formatCurrency(row.cashIn)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-default-500">Kas Keluar</span>
                          <span className="font-semibold text-danger">{formatCurrency(row.cashOut)}</span>
                        </div>
                        <div className="flex items-center justify-between border-t border-default-200 pt-1.5">
                          <span className="text-default-500">Selisih</span>
                          <span className={`font-semibold ${row.net >= 0 ? 'text-success' : 'text-danger'}`}>
                            {formatCurrency(row.net)}
                          </span>
                        </div>
                      </div>
                      <Button
                        as={Link}
                        href={`/dashboard/cash-summary/${row.locationId}?${detailQs.toString()}`}
                        size="sm"
                        variant="flat"
                        className="mt-3 w-full"
                      >
                        Detail
                      </Button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <Table aria-label="Kas per lokasi">
                <TableHeader>
                  <TableColumn>LOKASI</TableColumn>
                  <TableColumn>KAS MASUK</TableColumn>
                  <TableColumn>KAS KELUAR</TableColumn>
                  <TableColumn>SELISIH</TableColumn>
                  <TableColumn>AKSI</TableColumn>
                </TableHeader>
                <TableBody emptyContent="Belum ada pergerakan kas pada periode ini">
                  {summary.byLocation.map((row) => {
                    const detailQs = new URLSearchParams();
                    if (from) detailQs.set('from', from);
                    if (to) detailQs.set('to', to);
                    return (
                      <TableRow key={row.locationId}>
                        <TableCell>{row.locationName}</TableCell>
                        <TableCell className="text-success">{formatCurrency(row.cashIn)}</TableCell>
                        <TableCell className="text-danger">{formatCurrency(row.cashOut)}</TableCell>
                        <TableCell className={row.net >= 0 ? 'text-success' : 'text-danger'}>
                          {formatCurrency(row.net)}
                        </TableCell>
                        <TableCell>
                          <Button
                            as={Link}
                            href={`/dashboard/cash-summary/${row.locationId}?${detailQs.toString()}`}
                            size="sm"
                            variant="flat"
                          >
                            Detail
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      ) : (
        <div className="flex min-h-[160px] flex-col items-center justify-center rounded-xl border border-dashed border-default-200 bg-default-50 p-8 text-center">
          <Wallet className="mb-3 h-8 w-8 text-default-400" />
          <p className="text-sm text-default-500">Belum ada data kas.</p>
        </div>
      )}
    </div>
  );
}
