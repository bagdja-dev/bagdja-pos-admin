'use client';

import { useState } from 'react';
import { Button, Tooltip } from '@heroui/react';
import { Tag } from 'lucide-react';

import { AppModal } from './app-modal';
import { NumberInput } from './number-input';
import { emitGlobalError } from '../lib/error-bus';
import { buildProductLabelBytes, printViaBluetooth } from '../lib/thermal-printer';
import type { PosProduct } from '../lib/types';

interface PrintLabelButtonProps {
  product: PosProduct;
}

/**
 * Tombol "Cetak Label" — buka modal tanya jumlah label dulu, lalu cetak
 * label harga barang (QR di kiri berisi SKU/nama/harga, teks nama/SKU/harga
 * di kanan) ke sticker thermal 60mm via Web Bluetooth. Chrome/Edge saja
 * (lihat lib/thermal-printer.ts).
 */
export function PrintLabelButton({ product }: PrintLabelButtonProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [quantity, setQuantity] = useState('1');
  const [printing, setPrinting] = useState(false);

  function openModal() {
    setQuantity('1');
    setModalOpen(true);
  }

  async function handlePrint() {
    const copies = Number(quantity) || 0;
    if (copies <= 0) return;

    setPrinting(true);
    try {
      const bytes = await buildProductLabelBytes(
        {
          name: product.name,
          sku: product.sku,
          price: Number(product.sale_price),
        },
        copies,
      );
      await printViaBluetooth(bytes);
      setModalOpen(false);
    } catch (err) {
      // Klik "Cancel" di dialog pilih device juga masuk sini (DOMException NotFoundError) — bukan error beneran.
      const message = err instanceof Error ? err.message : 'Gagal mencetak label';
      if (!message.toLowerCase().includes('user cancel')) {
        emitGlobalError(message);
      }
    } finally {
      setPrinting(false);
    }
  }

  return (
    <>
      <Tooltip content="Cetak Label">
        <Button size="sm" variant="flat" isIconOnly onPress={openModal} aria-label="Cetak Label">
          <Tag className="h-3.5 w-3.5" />
        </Button>
      </Tooltip>

      <AppModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={`Cetak Label — ${product.name}`}
        footer={
          <>
            <Button variant="flat" onPress={() => setModalOpen(false)}>
              Batal
            </Button>
            <Button color="primary" isLoading={printing} onPress={handlePrint}>
              Cetak
            </Button>
          </>
        }
      >
        <NumberInput
          label="Jumlah Label"
          value={quantity}
          onValueChange={setQuantity}
          isRequired
        />
      </AppModal>
    </>
  );
}
