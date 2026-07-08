'use client';

import { Button } from '@heroui/react';

import { AsyncSearchSelect, type AsyncOption } from './async-search-select';
import { CurrencyInput } from './currency-input';
import { NumberInput } from './number-input';
import type { PosInvoiceType, PosProduct } from '../lib/types';

export interface ItemRow {
  product_id: string;
  product_label: string;
  quantity: string;
  adjusted_price: string;
  /** Harga master produk saat dipilih (sale_price/purchase_price sesuai tipe faktur) — dasar perbandingan naik/turun. */
  default_price: string;
}

export const EMPTY_ITEM_ROW: ItemRow = {
  product_id: '',
  product_label: '',
  quantity: '1',
  adjusted_price: '',
  default_price: '',
};

export function calcGrandTotal(items: ItemRow[]): number {
  return items.reduce((sum, i) => {
    const price = Number(i.adjusted_price || i.default_price || 0);
    const qty = Number(i.quantity || 0);
    return sum + price * qty;
  }, 0);
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);
}

interface ItemRowsEditorProps {
  items: ItemRow[];
  onChange: (items: ItemRow[]) => void;
  invoiceType: PosInvoiceType;
  fetchProductOptions: (search: string) => Promise<AsyncOption[]>;
}

/** Editor baris barang faktur (produk/qty/harga) — dipakai di form Buat Faktur & Edit Draft. */
export function ItemRowsEditor({ items, onChange, invoiceType, fetchProductOptions }: ItemRowsEditorProps) {
  function updateItem(index: number, patch: Partial<ItemRow>) {
    onChange(items.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }

  function selectProduct(index: number, id: string, label: string, raw?: unknown) {
    const product = raw as PosProduct | undefined;
    const defaultPrice = product ? (invoiceType === 'purchase' ? product.purchase_price : product.sale_price) : '';
    updateItem(index, {
      product_id: id,
      product_label: label,
      default_price: defaultPrice,
      adjusted_price: defaultPrice,
    });
  }

  function addItem() {
    onChange([...items, { ...EMPTY_ITEM_ROW }]);
  }

  function removeItem(index: number) {
    onChange(items.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-foreground">Barang</p>
      {items.map((item, idx) => {
        const defaultPrice = Number(item.default_price || 0);
        const adjustedPrice = Number(item.adjusted_price || 0);
        const tone =
          !item.product_id || !item.adjusted_price || adjustedPrice === defaultPrice
            ? 'neutral'
            : adjustedPrice > defaultPrice
              ? 'up'
              : 'down';
        const rowTotal = adjustedPrice * (Number(item.quantity) || 0);

        return (
          <div key={idx} className="flex items-end gap-2">
            <AsyncSearchSelect
              label="Produk"
              placeholder="Cari nama, SKU, atau tag..."
              className="flex-1"
              selectedId={item.product_id}
              selectedLabel={item.product_label}
              onSelect={(id, label, raw) => selectProduct(idx, id, label, raw)}
              fetchOptions={fetchProductOptions}
            />
            <NumberInput
              label="Qty"
              className="w-24"
              value={item.quantity}
              onValueChange={(v) => updateItem(idx, { quantity: v })}
            />
            <CurrencyInput
              label="Harga"
              className="w-44"
              value={item.adjusted_price}
              onValueChange={(v) => updateItem(idx, { adjusted_price: v })}
              tone={tone}
            />
            <div className="w-32 pb-2.5 text-right text-sm text-default-500">{formatCurrency(rowTotal)}</div>
            <Button size="sm" variant="flat" color="danger" onPress={() => removeItem(idx)} isDisabled={items.length === 1}>
              Hapus
            </Button>
          </div>
        );
      })}
      <Button size="sm" variant="flat" onPress={addItem}>
        + Tambah Baris
      </Button>
    </div>
  );
}
