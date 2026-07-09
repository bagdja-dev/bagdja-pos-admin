'use client';

import { useEffect, useState } from 'react';
import { Button, Input } from '@heroui/react';

import { AppModal } from './app-modal';
import { apiClient, ApiError } from '../lib/api-client';
import type { PosContact, PosContactType } from '../lib/types';

const CONTACT_TYPE_LABELS: Record<PosContactType, string> = {
  customer: 'Pelanggan',
  supplier: 'Supplier',
  lender: 'Pemberi Modal',
};

interface QuickAddContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  businessId: string;
  type: PosContactType;
  initialName?: string;
  onCreated: (contact: PosContact) => void;
}

/** Modal select-or-create ringkas — dipicu dari `AsyncSearchSelect` (prop `onCreateNew`) saat nama yang dicari belum ada di daftar kontak. */
export function QuickAddContactModal({ isOpen, onClose, businessId, type, initialName, onCreated }: QuickAddContactModalProps) {
  const [name, setName] = useState(initialName ?? '');
  const [phone, setPhone] = useState('');
  const [plateNumber, setPlateNumber] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setName(initialName ?? '');
      setPhone('');
      setPlateNumber('');
      setError(null);
    }
  }, [isOpen, initialName]);

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const contact = await apiClient<PosContact>(`/api/businesses/${businessId}/contacts`, {
        method: 'POST',
        body: JSON.stringify({
          type,
          name,
          ...(phone.trim() ? { phone } : {}),
          ...(plateNumber.trim() ? { plate_number: plateNumber } : {}),
        }),
      });
      onCreated(contact);
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal menambah kontak');
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Tambah ${CONTACT_TYPE_LABELS[type]} Baru`}
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
        <Input label="Nama" value={name} onValueChange={(v) => setName(v.toUpperCase())} isRequired autoFocus />
        <Input label="Telepon (opsional)" value={phone} onValueChange={setPhone} />
        {type === 'customer' && (
          <Input label="Plat Nomor (opsional)" value={plateNumber} onValueChange={setPlateNumber} />
        )}
        {error && <p className="text-sm text-danger">{error}</p>}
      </div>
    </AppModal>
  );
}
