'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button, Chip, Input, Select, SelectItem } from '@heroui/react';

import { AppModal } from '../../../components/app-modal';
import { CurrencyInput } from '../../../components/currency-input';
import { LoadingSpinner } from '../../../components/loading-spinner';
import { NoBusinessState } from '../../../components/no-business-state';
import { PaymentProofUploader } from '../../../components/payment-proof-uploader';
import { ReadOnlyField } from '../../../components/read-only-field';
import { StickyHeader } from '../../../components/sticky-header';
import { apiClient, ApiError } from '../../../lib/api-client';
import { formatCurrency as formatMoney } from '../../../lib/currency';
import { useBusinessContext } from '../../../context/business-context';
import {
  INVOICE_STATUS_LABELS,
  INVOICE_TYPE_LABELS,
  PAYMENT_STATUS_LABELS,
  PAIR_TYPE_LABELS,
  type PosInvoice,
  type PosInvoicePair,
  type PosPaymentMethod,
} from '../../../lib/types';

function InvoiceSummaryCard({
  title,
  invoice,
  outstanding,
}: {
  title: string;
  invoice: PosInvoice;
  outstanding: number | null;
}) {
  const { activeMembership } = useBusinessContext();
  function formatCurrency(value: number | string) {
    return formatMoney(value, activeMembership?.business.currency, activeMembership?.business.locale);
  }

  return (
    <div className="rounded-xl border border-default-200 p-4">
      <p className="text-[10px] font-bold uppercase tracking-wider text-default-500">{title}</p>
      <Link href={`/dashboard/invoices/${invoice.id}`} className="font-mono text-sm text-primary hover:underline">
        {invoice.invoice_number}
      </Link>
      <div className="mt-2 flex flex-wrap gap-1">
        <Chip size="sm" variant="flat">{INVOICE_TYPE_LABELS[invoice.type]}</Chip>
        <Chip size="sm" variant="flat">{INVOICE_STATUS_LABELS[invoice.status]}</Chip>
        <Chip size="sm" variant="flat">{PAYMENT_STATUS_LABELS[invoice.payment_status]}</Chip>
      </div>
      <div className="mt-3 space-y-1 text-sm">
        <p className="text-default-500">Pihak: <span className="text-foreground">{invoice.party?.name ?? '—'}</span></p>
        <p className="text-default-500">Total: <span className="font-semibold text-foreground">{formatCurrency(invoice.grand_total)}</span></p>
        {outstanding != null && outstanding > 0 && (
          <p className="text-danger">Sisa: <span className="font-semibold">{formatCurrency(outstanding)}</span></p>
        )}
      </div>
    </div>
  );
}

export default function InvoicePairDetailPage() {
  const params = useParams<{ id: string }>();
  const { businessId, activeMembership, loading: businessLoading } = useBusinessContext();
  function formatCurrency(value: number | string) {
    return formatMoney(value, activeMembership?.business.currency, activeMembership?.business.locale);
  }

  const [pair, setPair] = useState<PosInvoicePair | null>(null);
  const [sourceOutstanding, setSourceOutstanding] = useState<number | null>(null);
  const [targetOutstanding, setTargetOutstanding] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    payment_method: 'cash' as PosPaymentMethod,
    amount: '',
    proof_photo_url: '',
    note: '',
  });

  const load = useCallback(async () => {
    if (!businessId || !params.id) return;
    setLoading(true);
    try {
      const p = await apiClient<PosInvoicePair>(`/api/businesses/${businessId}/invoice-pairs/${params.id}`);
      setPair(p);

      if (p.source.status === 'submitted' || p.source.status === 'settled') {
        const l = await apiClient<{ outstanding: number }>(`/api/businesses/${businessId}/invoices/${p.source.id}/payments`);
        setSourceOutstanding(l.outstanding);
      } else {
        setSourceOutstanding(null);
      }
      if (p.target.status === 'submitted' || p.target.status === 'settled') {
        const l = await apiClient<{ outstanding: number }>(`/api/businesses/${businessId}/invoices/${p.target.id}/payments`);
        setTargetOutstanding(l.outstanding);
      } else {
        setTargetOutstanding(null);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal memuat pair tukar tambah');
    } finally {
      setLoading(false);
    }
  }, [businessId, params.id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleSubmitPair() {
    if (!businessId || !pair) return;
    setBusy(true);
    setError(null);
    try {
      await apiClient(`/api/businesses/${businessId}/invoice-pairs/${pair.id}/submit`, { method: 'POST' });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal submit tukar tambah');
    } finally {
      setBusy(false);
    }
  }

  async function handleRecordPayment() {
    if (!businessId || !pair) return;
    setBusy(true);
    setError(null);
    try {
      await apiClient(`/api/businesses/${businessId}/invoice-pairs/${pair.id}/payments`, {
        method: 'POST',
        body: JSON.stringify({
          payment_method: paymentForm.payment_method,
          amount: Number(paymentForm.amount),
          ...(paymentForm.proof_photo_url ? { proof_photo_url: paymentForm.proof_photo_url } : {}),
          ...(paymentForm.note ? { note: paymentForm.note } : {}),
        }),
      });
      setPaymentModalOpen(false);
      setPaymentForm({ payment_method: 'cash', amount: '', proof_photo_url: '', note: '' });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal mencatat pembayaran');
    } finally {
      setBusy(false);
    }
  }

  if (businessLoading || loading) return <LoadingSpinner />;
  if (!businessId) return <NoBusinessState />;
  if (!pair) return <p className="text-danger">{error ?? 'Pair tidak ditemukan'}</p>;

  const bothDraft = pair.source.status === 'draft' && pair.target.status === 'draft';
  const outstandingTotal = (sourceOutstanding ?? 0) + (targetOutstanding ?? 0);
  const canPay = !bothDraft && outstandingTotal > 0.01;
  const maxPayable = Math.max(sourceOutstanding ?? 0, targetOutstanding ?? 0);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <StickyHeader>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Tukar Tambah</h1>
            <p className="text-sm text-default-500">{PAIR_TYPE_LABELS[pair.pair_type]}</p>
          </div>
          <Chip color={outstandingTotal <= 0.01 && !bothDraft ? 'success' : 'primary'} variant="flat">
            {bothDraft ? 'Draft' : outstandingTotal <= 0.01 ? 'Lunas' : 'Ada Sisa Tagihan'}
          </Chip>
        </div>
      </StickyHeader>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <InvoiceSummaryCard title="Faktur Sumber (di-offset-kan)" invoice={pair.source} outstanding={sourceOutstanding} />
        <InvoiceSummaryCard title="Faktur Target (menerima offset)" invoice={pair.target} outstanding={targetOutstanding} />
      </div>

      <div className="flex gap-2">
        {bothDraft && (
          <Button color="primary" isLoading={busy} onPress={handleSubmitPair}>
            Submit Tukar Tambah
          </Button>
        )}
        {canPay && (
          <Button
            color="secondary"
            onPress={() => {
              setPaymentForm((f) => ({ ...f, amount: String(maxPayable) }));
              setPaymentModalOpen(true);
            }}
          >
            Catat Pembayaran
          </Button>
        )}
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      <AppModal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        title="Catat Pembayaran"
        footer={
          <>
            <Button variant="flat" onPress={() => setPaymentModalOpen(false)}>
              Batal
            </Button>
            <Button color="primary" isLoading={busy} onPress={handleRecordPayment}>
              Simpan
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <ReadOnlyField label="Sisa Tagihan" value={formatCurrency(maxPayable)} />
          <Select
            label="Metode"
            selectedKeys={[paymentForm.payment_method]}
            onSelectionChange={(keys) =>
              setPaymentForm((f) => ({ ...f, payment_method: Array.from(keys)[0] as PosPaymentMethod }))
            }
          >
            <SelectItem key="cash">Cash</SelectItem>
            <SelectItem key="transfer">Transfer</SelectItem>
          </Select>
          <CurrencyInput
            label="Jumlah"
            value={paymentForm.amount}
            onValueChange={(v) => setPaymentForm((f) => ({ ...f, amount: v }))}
            isRequired
          />
          {paymentForm.payment_method === 'transfer' && businessId && (
            <PaymentProofUploader
              businessId={businessId}
              value={paymentForm.proof_photo_url}
              onChange={(url) => setPaymentForm((f) => ({ ...f, proof_photo_url: url }))}
            />
          )}
          <Input
            label="Catatan (opsional)"
            value={paymentForm.note}
            onValueChange={(v) => setPaymentForm((f) => ({ ...f, note: v }))}
          />
        </div>
      </AppModal>
    </div>
  );
}
