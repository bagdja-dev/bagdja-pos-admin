'use client';

import { useState } from 'react';
import { Button, Input, Select, SelectItem } from '@heroui/react';

import { AsyncSearchSelect, type AsyncOption } from './async-search-select';
import { CurrencyInput } from './currency-input';
import { QuickAddServiceModal } from './quick-add-service-modal';
import type { PosStaff, ServiceItem } from '../lib/types';

export interface ServiceRow {
  service_id: string;
  service_label: string;
  mechanic_id: string;
  label: string;
  amount: string;
}

export function calcServiceTotal(rows: ServiceRow[]): number {
  return rows.reduce((sum, r) => sum + Number(r.amount || 0), 0);
}

interface ServiceRowsEditorProps {
  rows: ServiceRow[];
  onChange: (rows: ServiceRow[]) => void;
  mechanics: PosStaff[];
  fetchServiceOptions: (search: string) => Promise<AsyncOption[]>;
  /** Wajib diisi supaya "+ Tambah jasa baru" di pencarian master jasa bisa memanggil `POST /services`. */
  businessId: string;
}

/**
 * Editor baris jasa non-stok (mis. Ongkos Pasang Ban) — hanya relevan untuk
 * faktur `type=sale`. Beda dari `ItemRowsEditor`: opsional total (boleh 0
 * baris), dan `service_id` cuma referensi master jasa yang opsional —
 * `label` bebas diedit terpisah karena itu yang benar-benar disimpan.
 */
export function ServiceRowsEditor({ rows, onChange, mechanics, fetchServiceOptions, businessId }: ServiceRowsEditorProps) {
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [quickAddQuery, setQuickAddQuery] = useState('');
  const [quickAddRowIndex, setQuickAddRowIndex] = useState<number | null>(null);

  function updateRow(index: number, patch: Partial<ServiceRow>) {
    onChange(rows.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }

  function selectService(index: number, id: string, label: string, raw?: unknown) {
    const service = raw as ServiceItem | undefined;
    updateRow(index, {
      service_id: id,
      service_label: label,
      label: service?.name ?? label,
      amount: service?.default_price ?? '',
    });
  }

  function addRow() {
    onChange([...rows, { service_id: '', service_label: '', mechanic_id: '', label: '', amount: '' }]);
  }

  function removeRow(index: number) {
    onChange(rows.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-foreground">Jasa (opsional)</p>
      {rows.map((row, idx) => (
        <div
          key={idx}
          className="flex flex-col gap-2 border-b border-default-100 pb-3 last:border-0 md:flex-row md:items-end md:border-0 md:pb-0"
        >
          <div className="flex flex-wrap items-end gap-2">
            <AsyncSearchSelect
              label=""
              placeholder="Cari master jasa..."
              className="w-full md:flex-1"
              selectedId={row.service_id}
              selectedLabel={row.service_label}
              onSelect={(id, label, raw) => selectService(idx, id, label, raw)}
              fetchOptions={fetchServiceOptions}
              onCreateNew={(query) => {
                setQuickAddQuery(query);
                setQuickAddRowIndex(idx);
                setQuickAddOpen(true);
              }}
              createNewLabel={(q) => `Tambah "${q}" sebagai jasa baru`}
            />
            <Input
              label=""
              placeholder="Label jasa (mis. Ongkos Pasang Ban)"
              className="w-full sm:w-auto sm:flex-1 md:w-56 md:flex-none"
              value={row.label}
              onValueChange={(v) => updateRow(idx, { label: v.toUpperCase() })}
              isRequired
            />
            <Select
              label=""
              className="flex-1 md:w-44"
              selectedKeys={[row.mechanic_id || '']}
              onSelectionChange={(keys) => updateRow(idx, { mechanic_id: (Array.from(keys)[0] as string) ?? '' })}
            >
              {[
                <SelectItem key="">Tanpa mekanik</SelectItem>,
                ...mechanics.map((m) => <SelectItem key={m.id}>{m.email ?? m.user_id}</SelectItem>),
              ]}
            </Select>
            <CurrencyInput
              label=""
              className="flex-1 md:w-44"
              value={row.amount}
              onValueChange={(v) => updateRow(idx, { amount: v })}
            />
            <Button size="sm" variant="flat" color="danger" className="shrink-0" onPress={() => removeRow(idx)}>
              Hapus
            </Button>
          </div>
        </div>
      ))}
      <Button size="sm" variant="flat" onPress={addRow} className="mt-2">
        + Tambah Jasa
      </Button>

      <QuickAddServiceModal
        isOpen={quickAddOpen}
        onClose={() => setQuickAddOpen(false)}
        businessId={businessId}
        initialName={quickAddQuery}
        onCreated={(service) => {
          if (quickAddRowIndex !== null) selectService(quickAddRowIndex, service.id, service.name, service);
        }}
      />
    </div>
  );
}
