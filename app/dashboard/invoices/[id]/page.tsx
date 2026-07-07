'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Button,
  Chip,
  Input,
  Select,
  SelectItem,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from '@heroui/react';

import { AppModal } from '../../../components/app-modal';
import { LoadingSpinner } from '../../../components/loading-spinner';
import { NoBusinessState } from '../../../components/no-business-state';
import { apiClient, ApiError } from '../../../lib/api-client';
import { useBusinessContext } from '../../../context/business-context';
import {
  INVOICE_STATUS_LABELS,
  INVOICE_TYPE_LABELS,
  PAYMENT_STATUS_LABELS,
  type PosInvoice,
  type PosPaymentLedger,
  type PosPaymentMethod,
} from '../../../lib/types';

function formatCurrency(value: string) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(
    Number(value),
  );
}

export default function InvoiceDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { businessId, loading: businessLoading } = useBusinessContext();

  const [invoice, setInvoice] = useState<PosInvoice | null>(null);
  const [ledger, setLedger] = useState<{ entries: PosPaymentLedger[]; outstanding: number } | null>(null);
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

  const [settleModalOpen, setSettleModalOpen] = useState(false);
  const [received, setReceived] = useState<Record<string, string>>({});

  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [returnQty, setReturnQty] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    if (!businessId || !params.id) return;
    setLoading(true);
    try {
      const inv = await apiClient<PosInvoice>(`/api/businesses/${businessId}/invoices/${params.id}`);
      setInvoice(inv);

      if (inv.type !== 'transfer') {
        const l = await apiClient<{ entries: PosPaymentLedger[]; outstanding: number }>(
          `/api/businesses/${businessId}/invoices/${params.id}/payments`,
        );
        setLedger(l);
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal memuat faktur');
    } finally {
      setLoading(false);
    }
  }, [businessId, params.id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleSubmit() {
    if (!businessId || !invoice) return;
    setBusy(true);
    setError(null);
    try {
      await apiClient(`/api/businesses/${businessId}/invoices/${invoice.id}/submit`, { method: 'POST' });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal submit faktur');
    } finally {
      setBusy(false);
    }
  }

  async function handleVoid() {
    if (!businessId || !invoice) return;
    if (!confirm('Batalkan faktur draft ini?')) return;
    setBusy(true);
    try {
      await apiClient(`/api/businesses/${businessId}/invoices/${invoice.id}/void`, { method: 'POST' });
      await load();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Gagal void faktur');
    } finally {
      setBusy(false);
    }
  }

  async function handleRecordPayment() {
    if (!businessId || !invoice) return;
    setBusy(true);
    setError(null);
    try {
      await apiClient(`/api/businesses/${businessId}/invoices/${invoice.id}/payments`, {
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

  async function handleSettle() {
    if (!businessId || !invoice) return;
    setBusy(true);
    setError(null);
    try {
      await apiClient(`/api/businesses/${businessId}/invoices/${invoice.id}/settle`, {
        method: 'POST',
        body: JSON.stringify({
          items: (invoice.items ?? []).map((it) => ({
            item_id: it.id,
            quantity_received: Number(received[it.id] ?? it.quantity),
          })),
        }),
      });
      setSettleModalOpen(false);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal settlement');
    } finally {
      setBusy(false);
    }
  }

  async function handleReturn() {
    if (!businessId || !invoice) return;
    setBusy(true);
    setError(null);
    try {
      const items = (invoice.items ?? [])
        .filter((it) => Number(returnQty[it.id] ?? 0) > 0)
        .map((it) => ({ product_id: it.product_id, quantity: Number(returnQty[it.id]) }));

      if (items.length === 0) {
        setError('Isi minimal 1 quantity retur');
        setBusy(false);
        return;
      }

      const returnInvoice = await apiClient<PosInvoice>(
        `/api/businesses/${businessId}/invoices/${invoice.id}/return`,
        { method: 'POST', body: JSON.stringify({ items }) },
      );
      setReturnModalOpen(false);
      router.push(`/dashboard/invoices/${returnInvoice.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal membuat retur');
    } finally {
      setBusy(false);
    }
  }

  if (businessLoading || loading) return <LoadingSpinner />;
  if (!businessId) return <NoBusinessState />;
  if (!invoice) return <p className="text-danger">{error ?? 'Faktur tidak ditemukan'}</p>;

  const canPay = invoice.type !== 'transfer' && invoice.status === 'submitted' && invoice.payment_status !== 'paid';
  const canSettle = invoice.type === 'transfer' && invoice.flow === 'in' && invoice.status === 'submitted';
  const canReturn =
    invoice.type !== 'transfer' && (invoice.status === 'submitted' || invoice.status === 'settled') && !invoice.ref_invoice_id;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Faktur {INVOICE_TYPE_LABELS[invoice.type]}
            {invoice.ref_invoice_id && ' (Retur)'}
          </h1>
          <p className="text-sm text-default-500">{invoice.id}</p>
        </div>
        <div className="flex gap-2">
          <Chip color={invoice.status === 'void' ? 'danger' : 'primary'} variant="flat">
            {INVOICE_STATUS_LABELS[invoice.status]}
          </Chip>
          {invoice.type !== 'transfer' && (
            <Chip variant="flat">{PAYMENT_STATUS_LABELS[invoice.payment_status]}</Chip>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {invoice.status === 'draft' && (
          <>
            <Button color="primary" isLoading={busy} onPress={handleSubmit}>
              Submit Faktur
            </Button>
            <Button variant="flat" color="danger" isLoading={busy} onPress={handleVoid}>
              Void
            </Button>
          </>
        )}
        {canPay && (
          <Button color="secondary" onPress={() => setPaymentModalOpen(true)}>
            Catat Pembayaran
          </Button>
        )}
        {canSettle && (
          <Button color="secondary" onPress={() => setSettleModalOpen(true)}>
            Settlement (Terima Barang)
          </Button>
        )}
        {canReturn && (
          <Button variant="flat" onPress={() => setReturnModalOpen(true)}>
            Buat Retur
          </Button>
        )}
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      <div>
        <h2 className="mb-2 text-lg font-semibold text-foreground">Barang</h2>
        <Table aria-label="Item faktur">
          <TableHeader>
            <TableColumn>PRODUK</TableColumn>
            <TableColumn>QTY</TableColumn>
            <TableColumn>DITERIMA</TableColumn>
            <TableColumn>HARGA</TableColumn>
            <TableColumn>SUBTOTAL</TableColumn>
          </TableHeader>
          <TableBody emptyContent="Tidak ada item">
            {(invoice.items ?? []).map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.product?.name ?? item.product_id}</TableCell>
                <TableCell>{item.quantity}</TableCell>
                <TableCell>{item.quantity_received ?? '—'}</TableCell>
                <TableCell>{formatCurrency(item.adjusted_price)}</TableCell>
                <TableCell>{formatCurrency(item.subtotal)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {invoice.type === 'sale' && (invoice.services?.length ?? 0) > 0 && (
        <div>
          <h2 className="mb-2 text-lg font-semibold text-foreground">Jasa</h2>
          <Table aria-label="Jasa faktur">
            <TableHeader>
              <TableColumn>LABEL</TableColumn>
              <TableColumn>BIAYA</TableColumn>
            </TableHeader>
            <TableBody>
              {(invoice.services ?? []).map((s) => (
                <TableRow key={s.id}>
                  <TableCell>{s.label}</TableCell>
                  <TableCell>{formatCurrency(s.amount)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="flex justify-end">
        <div className="w-64 space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-default-500">Subtotal</span>
            <span>{formatCurrency(invoice.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-default-500">Jasa</span>
            <span>{formatCurrency(invoice.service_total)}</span>
          </div>
          <div className="flex justify-between font-semibold">
            <span>Grand Total</span>
            <span>{formatCurrency(invoice.grand_total)}</span>
          </div>
          {ledger && (
            <div className="flex justify-between text-primary">
              <span>Sisa Tagihan</span>
              <span>{formatCurrency(String(ledger.outstanding))}</span>
            </div>
          )}
        </div>
      </div>

      {ledger && ledger.entries.length > 0 && (
        <div>
          <h2 className="mb-2 text-lg font-semibold text-foreground">Kartu Ledger</h2>
          <Table aria-label="Ledger faktur">
            <TableHeader>
              <TableColumn>TIPE</TableColumn>
              <TableColumn>METODE</TableColumn>
              <TableColumn>DEBIT</TableColumn>
              <TableColumn>KREDIT</TableColumn>
              <TableColumn>WAKTU</TableColumn>
            </TableHeader>
            <TableBody>
              {ledger.entries.map((e) => (
                <TableRow key={e.id}>
                  <TableCell>{e.entry_type === 'invoice_issued' ? 'Tagihan' : 'Pembayaran'}</TableCell>
                  <TableCell>{e.payment_method ?? '—'}</TableCell>
                  <TableCell>{formatCurrency(e.debit)}</TableCell>
                  <TableCell>{formatCurrency(e.kredit)}</TableCell>
                  <TableCell>{new Date(e.created_at).toLocaleString('id-ID')}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Modal: Catat Pembayaran */}
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
          <Input
            label="Jumlah"
            type="number"
            value={paymentForm.amount}
            onValueChange={(v) => setPaymentForm((f) => ({ ...f, amount: v }))}
            isRequired
          />
          {paymentForm.payment_method === 'transfer' && (
            <Input
              label="URL Bukti Transfer"
              placeholder="https://... (upload dulu via /api/uploads/payment-proof)"
              value={paymentForm.proof_photo_url}
              onValueChange={(v) => setPaymentForm((f) => ({ ...f, proof_photo_url: v }))}
              isRequired
            />
          )}
          <Input
            label="Catatan (opsional)"
            value={paymentForm.note}
            onValueChange={(v) => setPaymentForm((f) => ({ ...f, note: v }))}
          />
        </div>
      </AppModal>

      {/* Modal: Settlement Transfer */}
      <AppModal
        isOpen={settleModalOpen}
        onClose={() => setSettleModalOpen(false)}
        title="Settlement — Jumlah Fisik Diterima"
        footer={
          <>
            <Button variant="flat" onPress={() => setSettleModalOpen(false)}>
              Batal
            </Button>
            <Button color="primary" isLoading={busy} onPress={handleSettle}>
              Selesaikan Settlement
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          {(invoice.items ?? []).map((item) => (
            <Input
              key={item.id}
              label={`${item.product?.name ?? item.product_id} (dikirim: ${item.quantity})`}
              type="number"
              value={received[item.id] ?? String(item.quantity)}
              onValueChange={(v) => setReceived((r) => ({ ...r, [item.id]: v }))}
            />
          ))}
        </div>
      </AppModal>

      {/* Modal: Retur */}
      <AppModal
        isOpen={returnModalOpen}
        onClose={() => setReturnModalOpen(false)}
        title="Buat Faktur Retur"
        footer={
          <>
            <Button variant="flat" onPress={() => setReturnModalOpen(false)}>
              Batal
            </Button>
            <Button color="primary" isLoading={busy} onPress={handleReturn}>
              Buat Retur
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-default-500">Isi jumlah yang diretur per produk (0 = tidak diretur).</p>
          {(invoice.items ?? []).map((item) => (
            <Input
              key={item.id}
              label={`${item.product?.name ?? item.product_id} (maks: ${item.quantity})`}
              type="number"
              value={returnQty[item.id] ?? '0'}
              onValueChange={(v) => setReturnQty((r) => ({ ...r, [item.id]: v }))}
            />
          ))}
          {error && <p className="text-sm text-danger">{error}</p>}
        </div>
      </AppModal>
    </div>
  );
}
