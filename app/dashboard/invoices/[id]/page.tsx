'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
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
import { CurrencyInput } from '../../../components/currency-input';
import { LoadingSpinner } from '../../../components/loading-spinner';
import { NumberInput } from '../../../components/number-input';
import { NoBusinessState } from '../../../components/no-business-state';
import { PaymentProofUploader } from '../../../components/payment-proof-uploader';
import { PrintReceiptButton } from '../../../components/print-receipt-button';
import { ReadOnlyField } from '../../../components/read-only-field';
import { apiClient, ApiError } from '../../../lib/api-client';
import { useBusinessContext } from '../../../context/business-context';
import {
  hasMinRole,
  INVOICE_STATUS_LABELS,
  INVOICE_TYPE_LABELS,
  PAYMENT_STATUS_LABELS,
  type PosInvoice,
  type PosInvoiceType,
  type PosPaymentLedger,
  type PosPaymentMethod,
} from '../../../lib/types';

const AMOUNT_LABEL: Partial<Record<PosInvoiceType, string>> = {
  capital: 'Jumlah Modal',
  withdrawal: 'Jumlah Penarikan',
};

/** Faktur `capital`/`withdrawal` sama-sama tanpa barang/jasa — nominalnya langsung dari `amount`. */
function isAmountBasedType(type: PosInvoiceType): boolean {
  return type === 'capital' || type === 'withdrawal';
}

function formatCurrency(value: string) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(
    Number(value),
  );
}

export default function InvoiceDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { businessId, activeMembership, role, loading: businessLoading } = useBusinessContext();
  const canSeeProfit = hasMinRole(role ?? '', 'manager');

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

  const [nonCashModalOpen, setNonCashModalOpen] = useState(false);
  const [nonCashNote, setNonCashNote] = useState('');

  const [chargeModalOpen, setChargeModalOpen] = useState(false);
  const [chargeForm, setChargeForm] = useState({
    payment_method: 'cash' as PosPaymentMethod,
    amount: '',
    proof_photo_url: '',
    note: '',
  });

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

  async function handleSettleNonCash() {
    if (!businessId || !invoice) return;
    setBusy(true);
    setError(null);
    try {
      await apiClient(`/api/businesses/${businessId}/invoices/${invoice.id}/settle-non-cash`, {
        method: 'POST',
        body: JSON.stringify({ ...(nonCashNote ? { note: nonCashNote } : {}) }),
      });
      setNonCashModalOpen(false);
      setNonCashNote('');
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal menyelesaikan tagihan');
    } finally {
      setBusy(false);
    }
  }

  async function handleRecordCharge() {
    if (!businessId || !invoice) return;
    setBusy(true);
    setError(null);
    try {
      await apiClient(`/api/businesses/${businessId}/invoices/${invoice.id}/interest`, {
        method: 'POST',
        body: JSON.stringify({
          payment_method: chargeForm.payment_method,
          amount: Number(chargeForm.amount),
          ...(chargeForm.proof_photo_url ? { proof_photo_url: chargeForm.proof_photo_url } : {}),
          ...(chargeForm.note ? { note: chargeForm.note } : {}),
        }),
      });
      setChargeModalOpen(false);
      setChargeForm({ payment_method: 'cash', amount: '', proof_photo_url: '', note: '' });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal mencatat bunga');
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
    invoice.type !== 'transfer' &&
    !isAmountBasedType(invoice.type) &&
    (invoice.status === 'submitted' || invoice.status === 'settled') &&
    !invoice.ref_invoice_id;
  const canCharge = invoice.type === 'capital' && invoice.status === 'submitted';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Faktur {INVOICE_TYPE_LABELS[invoice.type]}</h1>
          <p className="font-mono text-sm text-default-500">{invoice.invoice_number}</p>
          {invoice.refInvoice && (
            <p className="mt-1 text-sm text-default-500">
              Retur dari{' '}
              <Link href={`/dashboard/invoices/${invoice.refInvoice.id}`} className="font-mono text-primary hover:underline">
                {invoice.refInvoice.invoice_number}
              </Link>
            </p>
          )}
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

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <ReadOnlyField label="Tipe Faktur" value={INVOICE_TYPE_LABELS[invoice.type]} />
        <ReadOnlyField
          label={invoice.type === 'transfer' ? 'Lokasi Asal' : 'Lokasi'}
          value={invoice.location?.name ?? ''}
        />
        <ReadOnlyField
          label={
            invoice.type === 'sale'
              ? 'Pelanggan'
              : invoice.type === 'purchase'
                ? 'Supplier'
                : invoice.type === 'capital'
                  ? 'Pemberi Modal'
                  : invoice.type === 'withdrawal'
                    ? 'Diambil Oleh'
                    : 'Lokasi Tujuan'
          }
          value={invoice.party?.name ?? ''}
        />
      </div>

      {invoice.note && (
        <div className="rounded-xl border border-default-200 bg-default-100 px-4 py-2.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-default-500">Catatan</p>
          <p className="whitespace-pre-wrap text-sm text-foreground">{invoice.note}</p>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {invoice.status === 'draft' && (
          <>
            <Button variant="flat" onPress={() => router.push(`/dashboard/invoices/${invoice.id}/edit`)}>
              Edit
            </Button>
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
        {canPay && invoice.ref_invoice_id && (ledger?.outstanding ?? 0) > 0 && (
          <Button variant="flat" onPress={() => setNonCashModalOpen(true)}>
            Tandai Lunas (Tukar Barang)
          </Button>
        )}
        {canSettle && (
          <Button color="secondary" onPress={() => setSettleModalOpen(true)}>
            Settlement (Terima Barang)
          </Button>
        )}
        {canCharge && (
          <Button variant="flat" onPress={() => setChargeModalOpen(true)}>
            Catat Bunga
          </Button>
        )}
        {canReturn && (
          <Button variant="flat" onPress={() => setReturnModalOpen(true)}>
            Buat Retur
          </Button>
        )}
        {(invoice.status === 'submitted' || invoice.status === 'settled') && (
          <PrintReceiptButton
            invoice={invoice}
            businessName={activeMembership?.business.name ?? ''}
            locationName={activeMembership?.location?.name}
          />
        )}
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      {!isAmountBasedType(invoice.type) && (
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
      )}

      {invoice.type !== 'transfer' && (invoice.services?.length ?? 0) > 0 && (
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
            <span className="text-default-500">{AMOUNT_LABEL[invoice.type] ?? 'Subtotal'}</span>
            <span>{formatCurrency(invoice.subtotal)}</span>
          </div>
          {!isAmountBasedType(invoice.type) && (
            <div className="flex justify-between">
              <span className="text-default-500">Jasa</span>
              <span>{formatCurrency(invoice.service_total)}</span>
            </div>
          )}
          {Number(invoice.discount) > 0 && (
            <div className="flex justify-between">
              <span className="text-default-500">Diskon</span>
              <span className="text-danger">-{formatCurrency(invoice.discount)}</span>
            </div>
          )}
          <div className="flex justify-between font-semibold">
            <span>Grand Total</span>
            <span>{formatCurrency(invoice.grand_total)}</span>
          </div>
          {canSeeProfit && invoice.estimated_profit != null && (
            <div className="flex justify-between">
              <span className="text-default-500">Est. Untung</span>
              <span className={Number(invoice.estimated_profit) < 0 ? 'text-danger' : 'text-success'}>
                {formatCurrency(invoice.estimated_profit)}
              </span>
            </div>
          )}
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
                  <TableCell>
                    {e.entry_type === 'invoice_issued'
                      ? 'Tagihan'
                      : e.entry_type === 'adjustment'
                        ? 'Penyesuaian (Non-Tunai)'
                        : e.entry_type === 'charge'
                          ? 'Bunga'
                          : 'Pembayaran'}
                  </TableCell>
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

      {(invoice.returns?.length ?? 0) > 0 && (
        <div>
          <h2 className="mb-2 text-lg font-semibold text-foreground">Retur Terkait</h2>
          <Table aria-label="Retur terkait">
            <TableHeader>
              <TableColumn>NO. FAKTUR</TableColumn>
              <TableColumn>STATUS</TableColumn>
              <TableColumn>TOTAL</TableColumn>
              <TableColumn>AKSI</TableColumn>
            </TableHeader>
            <TableBody>
              {(invoice.returns ?? []).map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-mono text-xs">{r.invoice_number}</TableCell>
                  <TableCell>{INVOICE_STATUS_LABELS[r.status]}</TableCell>
                  <TableCell>{formatCurrency(r.grand_total)}</TableCell>
                  <TableCell>
                    <Button as={Link} href={`/dashboard/invoices/${r.id}`} size="sm" variant="flat">
                      Detail
                    </Button>
                  </TableCell>
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

      {/* Modal: Catat Bunga */}
      <AppModal
        isOpen={chargeModalOpen}
        onClose={() => setChargeModalOpen(false)}
        title="Catat Bunga"
        footer={
          <>
            <Button variant="flat" onPress={() => setChargeModalOpen(false)}>
              Batal
            </Button>
            <Button color="primary" isLoading={busy} onPress={handleRecordCharge}>
              Simpan
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-default-500">
            Kas keluar untuk bunga pinjaman — sisa pokok modal (di atas) TIDAK berkurang oleh pembayaran ini.
          </p>
          <Select
            label="Metode"
            selectedKeys={[chargeForm.payment_method]}
            onSelectionChange={(keys) =>
              setChargeForm((f) => ({ ...f, payment_method: Array.from(keys)[0] as PosPaymentMethod }))
            }
          >
            <SelectItem key="cash">Cash</SelectItem>
            <SelectItem key="transfer">Transfer</SelectItem>
          </Select>
          <CurrencyInput
            label="Jumlah Bunga"
            value={chargeForm.amount}
            onValueChange={(v) => setChargeForm((f) => ({ ...f, amount: v }))}
            isRequired
          />
          {chargeForm.payment_method === 'transfer' && businessId && (
            <PaymentProofUploader
              businessId={businessId}
              value={chargeForm.proof_photo_url}
              onChange={(url) => setChargeForm((f) => ({ ...f, proof_photo_url: url }))}
            />
          )}
          <Input
            label="Catatan (opsional)"
            value={chargeForm.note}
            onValueChange={(v) => setChargeForm((f) => ({ ...f, note: v }))}
          />
          {error && <p className="text-sm text-danger">{error}</p>}
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
            <NumberInput
              key={item.id}
              label={`${item.product?.name ?? item.product_id} (dikirim: ${item.quantity})`}
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
            <NumberInput
              key={item.id}
              label={`${item.product?.name ?? item.product_id} (maks: ${item.quantity})`}
              value={returnQty[item.id] ?? '0'}
              onValueChange={(v) => setReturnQty((r) => ({ ...r, [item.id]: v }))}
            />
          ))}
          {error && <p className="text-sm text-danger">{error}</p>}
        </div>
      </AppModal>

      {/* Modal: Tandai Lunas Non-Tunai */}
      <AppModal
        isOpen={nonCashModalOpen}
        onClose={() => setNonCashModalOpen(false)}
        title="Tandai Lunas (Tukar Barang)"
        footer={
          <>
            <Button variant="flat" onPress={() => setNonCashModalOpen(false)}>
              Batal
            </Button>
            <Button color="primary" isLoading={busy} onPress={handleSettleNonCash}>
              Selesaikan
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-default-500">
            Sisa tagihan (
            {ledger ? formatCurrency(String(ledger.outstanding)) : '—'}
            ) akan ditutup tanpa pergerakan uang — dipakai kalau retur diselesaikan lewat tukar barang, bukan refund tunai.
          </p>
          <Input
            label="Catatan (opsional)"
            placeholder="mis. Diganti barang baru"
            value={nonCashNote}
            onValueChange={setNonCashNote}
          />
          {error && <p className="text-sm text-danger">{error}</p>}
        </div>
      </AppModal>
    </div>
  );
}
