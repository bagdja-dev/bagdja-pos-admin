'use client';

import { useState } from 'react';
import { Button } from '@heroui/react';
import { Printer } from 'lucide-react';

import { buildReceiptBytes, printViaBluetooth, type ReceiptData } from '../lib/thermal-printer';
import { INVOICE_TYPE_LABELS, type PosInvoice } from '../lib/types';

interface PrintReceiptButtonProps {
  invoice: PosInvoice;
  businessName: string;
  logoUrl?: string | null;
  locationName?: string | null;
}

/** Tombol "Cetak Struk" — build byte ESC/POS dari data faktur, kirim via Web Bluetooth. Chrome/Edge saja (lihat lib/thermal-printer.ts). */
export function PrintReceiptButton({ invoice, businessName, logoUrl, locationName }: PrintReceiptButtonProps) {
  const [printing, setPrinting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePrint() {
    setPrinting(true);
    setError(null);
    try {
      const data: ReceiptData = {
        businessName,
        logoUrl,
        locationName,
        invoiceNumber: invoice.invoice_number,
        typeLabel: INVOICE_TYPE_LABELS[invoice.type],
        createdAt: invoice.created_at,
        items: (invoice.items ?? []).map((it) => ({
          name: it.product?.name ?? it.product_id,
          qty: it.quantity,
          price: Number(it.adjusted_price),
          subtotal: Number(it.subtotal),
        })),
        services: (invoice.services ?? []).map((s) => ({ label: s.label, amount: Number(s.amount) })),
        subtotal: Number(invoice.subtotal),
        serviceTotal: Number(invoice.service_total),
        grandTotal: Number(invoice.grand_total),
      };
      await printViaBluetooth(await buildReceiptBytes(data));
    } catch (err) {
      // Klik "Cancel" di dialog pilih device juga masuk sini (DOMException NotFoundError) — bukan error beneran.
      const message = err instanceof Error ? err.message : 'Gagal mencetak struk';
      if (!message.toLowerCase().includes('user cancel')) {
        setError(message);
      }
    } finally {
      setPrinting(false);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <Button variant="flat" isLoading={printing} startContent={!printing && <Printer className="h-4 w-4" />} onPress={handlePrint}>
        Cetak Struk
      </Button>
      {error && <p className="max-w-[220px] text-xs text-danger">{error}</p>}
    </div>
  );
}
