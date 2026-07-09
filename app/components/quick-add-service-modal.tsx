'use client';

import { useEffect, useState } from 'react';
import { Button, Input } from '@heroui/react';

import { AppModal } from './app-modal';
import { CurrencyInput } from './currency-input';
import { apiClient, ApiError } from '../lib/api-client';
import type { ServiceItem } from '../lib/types';

interface QuickAddServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  businessId: string;
  initialName?: string;
  onCreated: (service: ServiceItem) => void;
}

/** Modal select-or-create ringkas — dipicu dari `AsyncSearchSelect` (prop `onCreateNew`) saat nama jasa yang dicari belum ada di master jasa. */
export function QuickAddServiceModal({ isOpen, onClose, businessId, initialName, onCreated }: QuickAddServiceModalProps) {
  const [name, setName] = useState(initialName ?? '');
  const [defaultPrice, setDefaultPrice] = useState('0');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setName(initialName ?? '');
      setDefaultPrice('0');
      setError(null);
    }
  }, [isOpen, initialName]);

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const service = await apiClient<ServiceItem>(`/api/businesses/${businessId}/services`, {
        method: 'POST',
        body: JSON.stringify({
          name,
          default_price: Number(defaultPrice) || 0,
          is_active: true,
        }),
      });
      onCreated(service);
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal menambah jasa');
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppModal
      isOpen={isOpen}
      onClose={onClose}
      title="Tambah Jasa Baru"
      footer={
        <>
          <Button variant="flat" onPress={onClose}>
            Batal
          </Button>
          <Button color="primary" isLoading={saving} onPress={handleSave}>
            Simpan
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Input label="Nama Jasa" value={name} onValueChange={(v) => setName(v.toUpperCase())} isRequired autoFocus />
        <CurrencyInput label="Harga Default" value={defaultPrice} onValueChange={setDefaultPrice} />
        {error && <p className="text-sm text-danger">{error}</p>}
      </div>
    </AppModal>
  );
}
