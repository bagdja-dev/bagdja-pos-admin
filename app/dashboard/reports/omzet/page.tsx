'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button, Input, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from '@heroui/react';
import { BarChart3 } from 'lucide-react';

import { LoadingSpinner } from '../../../components/loading-spinner';
import { NoBusinessState } from '../../../components/no-business-state';
import { StickyHeader } from '../../../components/sticky-header';
import { apiClient, ApiError } from '../../../lib/api-client';
import { useBusinessContext } from '../../../context/business-context';

interface OmzetTotals {
  omzet: number;
  estimasiPendapatan: number;
  biaya: number;
  belanja: number;
}

interface OmzetByLocation extends OmzetTotals {
  locationId: string;
  locationName: string;
}

interface OmzetReport {
  from: string | null;
  to: string | null;
  total: OmzetTotals;
  byLocation: OmzetByLocation[];
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(
    value,
  );
}

export default function OmzetReportPage() {
  const { businessId, loading: businessLoading } = useBusinessContext();

  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [report, setReport] = useState<OmzetReport | null>(null);
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
      const res = await apiClient<OmzetReport>(`/api/businesses/${businessId}/reports/omzet?${qs.toString()}`);
      setReport(res);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal memuat laporan omzet');
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
    <div className="mx-auto max-w-4xl space-y-6">
      <StickyHeader className="space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Laporan Omzet</h1>
          <p className="text-sm text-default-500">
            Omzet & estimasi untung dari faktur jual, biaya jasa & belanja produk dari faktur beli — dipecah per
            lokasi.
          </p>
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
      ) : report ? (
        <div className="space-y-4">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-default-500">
              Total Semua Lokasi
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-default-200 bg-default-50 px-5 py-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-default-500">Total Omzet</p>
                <p className="text-xl font-bold text-success">{formatCurrency(report.total.omzet)}</p>
              </div>
              <div className="rounded-2xl border border-default-200 bg-default-50 px-5 py-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-default-500">
                  Estimasi Pendapatan
                </p>
                <p className="text-xl font-bold text-primary">{formatCurrency(report.total.estimasiPendapatan)}</p>
              </div>
              <div className="rounded-2xl border border-default-200 bg-default-50 px-5 py-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-default-500">Total Biaya (Jasa)</p>
                <p className="text-xl font-bold text-danger">{formatCurrency(report.total.biaya)}</p>
              </div>
              <div className="rounded-2xl border border-default-200 bg-default-50 px-5 py-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-default-500">
                  Total Belanja (Produk)
                </p>
                <p className="text-xl font-bold text-danger">{formatCurrency(report.total.belanja)}</p>
              </div>
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-default-500">Per Lokasi</p>
            <div className="overflow-x-auto">
              <Table aria-label="Omzet per lokasi">
                <TableHeader>
                  <TableColumn>LOKASI</TableColumn>
                  <TableColumn>OMZET</TableColumn>
                  <TableColumn>EST. PENDAPATAN</TableColumn>
                  <TableColumn>BIAYA (JASA)</TableColumn>
                  <TableColumn>BELANJA (PRODUK)</TableColumn>
                </TableHeader>
                <TableBody emptyContent="Belum ada data pada periode ini">
                  {report.byLocation.map((row) => (
                    <TableRow key={row.locationId}>
                      <TableCell>{row.locationName}</TableCell>
                      <TableCell className="text-success">{formatCurrency(row.omzet)}</TableCell>
                      <TableCell className="text-primary">{formatCurrency(row.estimasiPendapatan)}</TableCell>
                      <TableCell className="text-danger">{formatCurrency(row.biaya)}</TableCell>
                      <TableCell className="text-danger">{formatCurrency(row.belanja)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex min-h-[160px] flex-col items-center justify-center rounded-xl border border-dashed border-default-200 bg-default-50 p-8 text-center">
          <BarChart3 className="mb-3 h-8 w-8 text-default-400" />
          <p className="text-sm text-default-500">Belum ada data omzet.</p>
        </div>
      )}
    </div>
  );
}
