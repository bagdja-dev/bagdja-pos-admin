'use client';

import { useEffect, useState } from 'react';
import { Button, Input, Select, SelectItem } from '@heroui/react';

import { AppModal } from './app-modal';
import { apiClient, ApiError } from '../lib/api-client';
import { LOCATION_TYPE_LABELS, type PosLocation } from '../lib/types';

interface QuickAddLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  businessId: string;
  initialName?: string;
  onCreated: (location: PosLocation) => void;
}

/**
 * Modal select-or-create ringkas — dipicu dari `LocationSelect` (prop
 * `onCreateNew`) saat nama yang dicari belum ada di daftar lokasi. Perhatian:
 * `POST /locations` manager+ only (beda dari kontak yang cashier-role), jadi
 * user berperan cashier tetap bisa membuka modal ini tapi akan dapat pesan
 * error kalau menyimpan — sama seperti pola `QuickAddServiceModal` untuk jasa.
 */
export function QuickAddLocationModal({ isOpen, onClose, businessId, initialName, onCreated }: QuickAddLocationModalProps) {
  const [name, setName] = useState(initialName ?? '');
  const [type, setType] = useState<'store' | 'warehouse'>('store');
  const [address, setAddress] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setName(initialName ?? '');
      setType('store');
      setAddress('');
      setError(null);
    }
  }, [isOpen, initialName]);

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const location = await apiClient<PosLocation>(`/api/businesses/${businessId}/locations`, {
        method: 'POST',
        body: JSON.stringify({
          name,
          type,
          ...(address.trim() ? { address } : {}),
        }),
      });
      onCreated(location);
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal menambah lokasi');
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppModal
      isOpen={isOpen}
      onClose={onClose}
      title="Tambah Lokasi Baru"
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
        <Input label="Nama Lokasi" value={name} onValueChange={setName} isRequired autoFocus />
        <Select
          label="Tipe"
          selectedKeys={[type]}
          onSelectionChange={(keys) => setType(Array.from(keys)[0] as 'store' | 'warehouse')}
        >
          {Object.entries(LOCATION_TYPE_LABELS).map(([key, label]) => (
            <SelectItem key={key}>{label}</SelectItem>
          ))}
        </Select>
        <Input label="Alamat (opsional)" value={address} onValueChange={setAddress} />
        {error && <p className="text-sm text-danger">{error}</p>}
      </div>
    </AppModal>
  );
}
