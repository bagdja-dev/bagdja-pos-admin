'use client';

import { useCallback, useEffect, useState } from 'react';
import { Chip, Table, TableBody, TableCell, TableColumn, TableHeader, TableRow } from '@heroui/react';

import { LoadingSpinner } from '../../components/loading-spinner';
import { NoBusinessState } from '../../components/no-business-state';
import { apiClient, ApiError } from '../../lib/api-client';
import { useBusinessContext } from '../../context/business-context';
import type { PosContact } from '../../lib/types';

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
  const [rows, setRows] = useState<LedgerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!businessId) return;
    setLoading(true);
    try {
      const data = await apiClient<LedgerRow[]>(`/api/businesses/${businessId}/ledger`);
      setRows(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal memuat kartu piutang/hutang');
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
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Piutang / Hutang</h1>
        <p className="text-sm text-default-500">
          Saldo positif = piutang (pelanggan berhutang ke kita). Saldo negatif = hutang (kita berhutang ke supplier).
        </p>
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      {loading ? (
        <LoadingSpinner />
      ) : (
        <Table aria-label="Kartu piutang/hutang">
          <TableHeader>
            <TableColumn>PARTNER</TableColumn>
            <TableColumn>TIPE</TableColumn>
            <TableColumn>TOTAL DEBIT</TableColumn>
            <TableColumn>TOTAL KREDIT</TableColumn>
            <TableColumn>SALDO</TableColumn>
          </TableHeader>
          <TableBody emptyContent="Belum ada aktivitas piutang/hutang">
            {rows.map((row) => (
              <TableRow key={row.partnerId}>
                <TableCell>{row.partner?.name ?? row.partnerId}</TableCell>
                <TableCell>{row.partner?.type === 'supplier' ? 'Supplier' : 'Pelanggan'}</TableCell>
                <TableCell>{formatCurrency(row.totalDebit)}</TableCell>
                <TableCell>{formatCurrency(row.totalKredit)}</TableCell>
                <TableCell>
                  <Chip color={row.balance > 0 ? 'success' : row.balance < 0 ? 'danger' : 'default'} variant="flat">
                    {formatCurrency(Math.abs(row.balance))} {row.balance > 0 ? '(Piutang)' : row.balance < 0 ? '(Hutang)' : ''}
                  </Chip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
