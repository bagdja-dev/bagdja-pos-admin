'use client';

import { useEffect, useState } from 'react';
import { Button, Select, SelectItem } from '@heroui/react';

import { LoadingSpinner } from '../../components/loading-spinner';
import { NoBusinessState } from '../../components/no-business-state';
import { StickyHeader } from '../../components/sticky-header';
import { apiClient, ApiError } from '../../lib/api-client';
import { useBusinessContext } from '../../context/business-context';
import { hasMinRole, type PosBusiness } from '../../lib/types';

const SUPPORTED_CURRENCIES = [
  { value: 'IDR', label: 'Rupiah Indonesia (IDR)' },
  { value: 'MYR', label: 'Ringgit Malaysia (MYR)' },
  { value: 'THB', label: 'Baht Thailand (THB)' },
  { value: 'PHP', label: 'Peso Filipina (PHP)' },
  { value: 'LAK', label: 'Kip Laos (LAK)' },
];

// Dibatasi ke locale yang katalog terjemahannya sudah ada (lihat
// `app/i18n/business-intl-provider.tsx`'s MESSAGE_LOADERS) — tambahkan baris
// di sini bersamaan dengan menambahkan `messages/<locale>.json` baru.
const SUPPORTED_LOCALES = [{ value: 'id-ID', label: 'Bahasa Indonesia' }];

export default function BusinessSettingsPage() {
  const { businessId, activeMembership, role, loading: businessLoading, refresh } = useBusinessContext();
  const isOwner = hasMinRole(role ?? '', 'owner');

  const [currency, setCurrency] = useState('IDR');
  const [locale, setLocale] = useState('id-ID');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (activeMembership?.business) {
      setCurrency(activeMembership.business.currency);
      setLocale(activeMembership.business.locale);
    }
  }, [activeMembership?.business]);

  async function handleSave() {
    if (!businessId) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await apiClient<PosBusiness>(`/api/businesses/${businessId}`, {
        method: 'PATCH',
        body: JSON.stringify({ currency, locale }),
      });
      await refresh();
      setSaved(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal menyimpan pengaturan');
    } finally {
      setSaving(false);
    }
  }

  if (businessLoading) return <LoadingSpinner />;
  if (!businessId) return <NoBusinessState />;

  if (!isOwner) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-default-300 text-center">
        <p className="text-lg font-semibold text-foreground">Khusus Owner</p>
        <p className="max-w-sm text-sm text-default-500">
          Cuma owner bisnis yang bisa mengubah mata uang dan bahasa. Hubungi owner bisnis ini kalau perlu diganti.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <StickyHeader>
        <h1 className="text-2xl font-bold text-foreground">Pengaturan Bisnis</h1>
        <p className="text-sm text-default-500">
          Mata uang & bahasa berlaku untuk semua staf di bisnis ini — bukan preferensi per orang.
        </p>
      </StickyHeader>

      <div className="space-y-4">
        <Select
          label="Mata Uang"
          selectedKeys={[currency]}
          onSelectionChange={(keys) => setCurrency((Array.from(keys)[0] as string) ?? 'IDR')}
        >
          {SUPPORTED_CURRENCIES.map((c) => (
            <SelectItem key={c.value}>{c.label}</SelectItem>
          ))}
        </Select>

        <Select
          label="Bahasa"
          selectedKeys={[locale]}
          onSelectionChange={(keys) => setLocale((Array.from(keys)[0] as string) ?? 'id-ID')}
        >
          {SUPPORTED_LOCALES.map((l) => (
            <SelectItem key={l.value}>{l.label}</SelectItem>
          ))}
        </Select>

        {error && <p className="text-sm text-danger">{error}</p>}
        {saved && <p className="text-sm text-success">Pengaturan tersimpan.</p>}

        <Button color="primary" fullWidth isLoading={saving} onPress={handleSave}>
          Simpan
        </Button>
      </div>
    </div>
  );
}
