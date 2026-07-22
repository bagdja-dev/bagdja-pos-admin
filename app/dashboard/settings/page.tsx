'use client';

import { useCallback, useEffect, useState } from 'react';
import { Button, Select, SelectItem } from '@heroui/react';

import { LoadingSpinner } from '../../components/loading-spinner';
import { NoBusinessState } from '../../components/no-business-state';
import { StickyHeader } from '../../components/sticky-header';
import { apiClient, ApiError } from '../../lib/api-client';
import { getCookie, setCookie } from '../../lib/cookies';
import { SUPPORTED_CURRENCIES } from '../../lib/currency';
import { useBusinessContext } from '../../context/business-context';
import { hasMinRole, type PosBusiness } from '../../lib/types';

// Dibatasi ke locale yang katalog terjemahannya sudah ada (lihat
// `app/i18n/business-intl-provider.tsx`'s MESSAGE_LOADERS) — tambahkan baris
// di sini bersamaan dengan menambahkan `messages/<locale>.json` baru.
const SUPPORTED_LOCALES = [
  { value: 'id-ID', label: 'Bahasa Indonesia' },
  { value: 'ms-MY', label: 'Bahasa Melayu (Malaysia)' },
  { value: 'fil-PH', label: 'Filipino (Philippines)' },
  { value: 'vi-VN', label: 'Tiếng Việt (Vietnam)' },
];
const LANG_COOKIE = 'lang';
const DEFAULT_LOCALE = 'id-ID';

export default function BusinessSettingsPage() {
  const { businessId, activeMembership, role, loading: businessLoading, refresh } = useBusinessContext();
  const isOwner = hasMinRole(role ?? '', 'owner');

  const [currency, setCurrency] = useState('IDR');
  const [locale, setLocale] = useState(DEFAULT_LOCALE);
  const [hasInvoices, setHasInvoices] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const loadDetail = useCallback(async () => {
    if (!businessId) return;
    setLoadingDetail(true);
    try {
      const detail = await apiClient<PosBusiness & { hasInvoices: boolean }>(`/api/businesses/${businessId}`);
      setCurrency(detail.currency);
      setHasInvoices(detail.hasInvoices);
    } finally {
      setLoadingDetail(false);
    }
  }, [businessId]);

  useEffect(() => {
    void loadDetail();
  }, [loadDetail]);

  useEffect(() => {
    setLocale(getCookie(LANG_COOKIE) ?? DEFAULT_LOCALE);
  }, []);

  async function handleSave() {
    if (!businessId) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      if (!hasInvoices && currency !== activeMembership?.business.currency) {
        await apiClient<PosBusiness>(`/api/businesses/${businessId}`, {
          method: 'PATCH',
          body: JSON.stringify({ currency }),
        });
        await refresh();
      }

      const localeChanged = locale !== (getCookie(LANG_COOKIE) ?? DEFAULT_LOCALE);
      if (localeChanged) {
        setCookie(LANG_COOKIE, locale);
      }

      setSaved(true);
      // Bahasa cuma dibaca sekali saat BusinessIntlProvider mount — reload
      // supaya katalog barunya kepakai, bukan diam-diam nunggu next-navigate.
      if (localeChanged) window.location.reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal menyimpan pengaturan');
    } finally {
      setSaving(false);
    }
  }

  if (businessLoading || loadingDetail) return <LoadingSpinner />;
  if (!businessId) return <NoBusinessState />;

  if (!isOwner) {
    return (
      <div className="flex h-96 flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-default-300 text-center">
        <p className="text-lg font-semibold text-foreground">Khusus Owner</p>
        <p className="max-w-sm text-sm text-default-500">
          Cuma owner bisnis yang bisa mengubah mata uang. Hubungi owner bisnis ini kalau perlu diganti.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <StickyHeader>
        <h1 className="text-2xl font-bold text-foreground">Pengaturan Bisnis</h1>
        <p className="text-sm text-default-500">
          Mata uang berlaku untuk semua staf di bisnis ini. Bahasa cuma preferensi tampilan di perangkat ini.
        </p>
      </StickyHeader>

      <div className="space-y-4">
        <Select
          label="Mata Uang"
          isDisabled={hasInvoices}
          description={
            hasInvoices
              ? 'Terkunci — bisnis ini sudah punya faktur, mata uang tidak bisa diubah lagi.'
              : 'Tidak bisa diubah lagi setelah faktur pertama dibuat.'
          }
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
          onSelectionChange={(keys) => setLocale((Array.from(keys)[0] as string) ?? DEFAULT_LOCALE)}
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
