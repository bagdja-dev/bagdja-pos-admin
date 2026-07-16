'use client';

import { useState } from 'react';
import { Button, Switch } from '@heroui/react';

import type { PagedFetchOptions } from './async-search-select';
import { ProductSearchSelect } from './product-search-select';
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
  fetchProductOptions: PagedFetchOptions;
}

/** Editor baris barang faktur (produk/qty/harga) — dipakai di form Buat Faktur & Edit Draft. */
export function ItemRowsEditor({ items, onChange, invoiceType, fetchProductOptions }: ItemRowsEditorProps) {
  const [showPurchasePrice, setShowPurchasePrice] = useState(true);

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
    <div className="">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-foreground">Barang</p>
        <div className="flex items-center gap-2">
          <span className="text-xs text-default-500">Tampilkan harga beli</span>
          <Switch
            size="sm"
            isSelected={showPurchasePrice}
            onValueChange={setShowPurchasePrice}
            aria-label="Tampilkan harga beli"
          />
        </div>
      </div>
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
          <div
            key={idx}
            className="grid grid-cols-1 gap-2 border-b border-default-100 pb-3 last:border-0 md:grid-cols-[minmax(0,1fr)_6rem_11rem_8rem_5.5rem] md:items-center md:gap-x-2 md:gap-y-0 md:border-0 md:pb-0"
          >
            <ProductSearchSelect
              label=""
              placeholder="Cari nama, SKU, atau tag..."
              className="min-w-0 w-full"
              selectedId={item.product_id}
              selectedLabel={item.product_label}
              onSelect={(id, label, raw) => selectProduct(idx, id, label, raw)}
              invoiceType={invoiceType}
              fetchOptions={fetchProductOptions}
            />
            {/* `md:contents` melepas div ini dari box model di layar md+ supaya
                anak-anaknya jadi grid item langsung (mengisi kolom qty/harga/
                total/hapus di atas) — di mobile tetap flex row seperti biasa. */}
            <div className="flex items-end gap-2 md:contents">
              <NumberInput
                label=""
                className="w-20 md:w-full"
                value={item.quantity}
                onValueChange={(v) => updateItem(idx, { quantity: v })}
              />
              <CurrencyInput
                label=""
                className="flex-1 md:w-full"
                value={item.adjusted_price}
                onValueChange={(v) => updateItem(idx, { adjusted_price: v })}
                tone={tone}
              />
              <div className="hidden shrink-0 pb-2.5 text-right text-sm text-default-500 md:block md:pb-0">
                {formatCurrency(rowTotal)}
              </div>
              <Button
                size="sm"
                variant="flat"
                color="danger"
                className="shrink-0"
                onPress={() => removeItem(idx)}
                isDisabled={items.length === 1}
              >
                Hapus
              </Button>
            </div>
            <div className="text-right text-xs text-default-500 md:hidden">Subtotal: {formatCurrency(rowTotal)}</div>
          </div>
        );
      })}
      <Button size="sm" variant="flat" onPress={addItem} className="mt-2">
        + Tambah Baris
      </Button>
    </div>
  );
}
