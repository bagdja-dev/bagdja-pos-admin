'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, Textarea } from '@heroui/react';

import { AsyncSearchSelect, type PagedFetchResult } from '../../../../components/async-search-select';
import { CurrencyInput } from '../../../../components/currency-input';
import { InvoiceAttachmentsUploader } from '../../../../components/invoice-attachments-uploader';
import { LocationSelect } from '../../../../components/location-select';
import { StickyHeader } from '../../../../components/sticky-header';
import { LoadingSpinner } from '../../../../components/loading-spinner';
import { NoBusinessState } from '../../../../components/no-business-state';
import { QuickAddContactModal } from '../../../../components/quick-add-contact-modal';
import { QuickAddLocationModal } from '../../../../components/quick-add-location-modal';
import { apiClient, ApiError } from '../../../../lib/api-client';
import { formatCurrency as formatMoney } from '../../../../lib/currency';
import { useBusinessContext } from '../../../../context/business-context';
import { type GridResult, type PosContact, type PosInvoice, type PosLocation } from '../../../../lib/types';

/** Label jasa marker sistem — di-resolve otomatis di backend (find-or-create master jasa) & di UI (terjemahan), lihat `lib/service-marker.ts`. */
const DEBT_NOTE_SERVICE_MARKER = '[[SELL]]';

export default function NewDebtNotePage() {
  const router = useRouter();
  const { businessId, activeMembership, loading: businessLoading } = useBusinessContext();
  function formatCurrency(value: number | string) {
    return formatMoney(value, activeMembership?.business.currency, activeMembership?.business.locale);
  }

  const [locationId, setLocationId] = useState('');
  const [partyId, setPartyId] = useState('');
  const [partyLabel, setPartyLabel] = useState('');
  const [amount, setAmount] = useState('0');
  const [note, setNote] = useState('');
  const [stagedAttachments, setStagedAttachments] = useState<File[]>([]);

  const [savingAction, setSavingAction] = useState<'draft' | 'submit' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [contactModalQuery, setContactModalQuery] = useState('');
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [locationModalQuery, setLocationModalQuery] = useState('');
  const [locationRefreshToken, setLocationRefreshToken] = useState(0);
  const hasAutoSelectedLocationRef = useRef(false);

  useEffect(() => {
    if (!businessId || hasAutoSelectedLocationRef.current) return;

    let cancelled = false;
    hasAutoSelectedLocationRef.current = true;

    apiClient<GridResult<PosLocation>>(`/api/businesses/${businessId}/locations?size=20`)
      .then((res) => {
        if (cancelled || !res.data?.length) return;
        setLocationId(res.data[0].id);
      })
      .catch(() => {
        if (!cancelled) {
          hasAutoSelectedLocationRef.current = false;
        }
      });

    return () => {
      cancelled = true;
    };
  }, [businessId]);

  const fetchPartyOptions = useCallback(
    async (search: string, page: number): Promise<PagedFetchResult> => {
      if (!businessId) return { items: [], hasMore: false };
      const res = await apiClient<GridResult<PosContact>>(
        `/api/businesses/${businessId}/contacts?search=${encodeURIComponent(search)}&size=10&page=${page}`,
      );
      return {
        items: res.data.map((c) => ({ id: c.id, label: c.name, description: c.phone ?? c.plate_number ?? undefined })),
        hasMore: res.meta.currentPage < res.meta.totalPages,
      };
    },
    [businessId],
  );

  async function handleSubmit(alsoSubmit: boolean) {
    if (!businessId || !locationId || !partyId) {
      setError('Lokasi dan pelanggan wajib diisi');
      return;
    }
    if (!Number(amount) || Number(amount) <= 0) {
      setError('Nominal wajib diisi (lebih dari 0)');
      return;
    }

    setSavingAction(alsoSubmit ? 'submit' : 'draft');
    setError(null);
    try {
      const invoice = await apiClient<PosInvoice>(`/api/businesses/${businessId}/invoices`, {
        method: 'POST',
        body: JSON.stringify({
          type: 'sale',
          location_id: locationId,
          party_type: 'customer',
          party_id: partyId,
          items: [],
          services: [{ label: DEBT_NOTE_SERVICE_MARKER, amount: Number(amount) }],
          ...(note.trim() ? { note: note.trim() } : {}),
        }),
      });

      // Sama seperti alur faktur biasa — lampiran cuma bisa diunggah SETELAH
      // faktur tersimpan (butuh invoice.id). Gagal unggah tidak membatalkan
      // faktur yang sudah tersimpan.
      for (const file of stagedAttachments) {
        try {
          const form = new FormData();
          form.append('file', file);
          const res = await fetch(
            `/api/uploads/invoice-attachment?businessId=${businessId}&invoiceId=${invoice.id}`,
            { method: 'POST', body: form },
          );
          if (!res.ok) throw new Error();
        } catch {
          alert(`Faktur tersimpan, tapi gagal unggah lampiran "${file.name}". Bisa diunggah ulang lewat halaman Edit Faktur (faktur ini masih berstatus draft).`);
        }
      }

      if (alsoSubmit) {
        try {
          await apiClient(`/api/businesses/${businessId}/invoices/${invoice.id}/submit`, { method: 'POST' });
        } catch (err) {
          alert(
            `Faktur tersimpan sebagai draft, tapi gagal disubmit otomatis: ${
              err instanceof ApiError ? err.message : 'terjadi kesalahan'
            }. Submit manual dari halaman detail faktur.`,
          );
        }
      }

      router.push(`/dashboard/invoices/${invoice.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Gagal membuat faktur');
    } finally {
      setSavingAction(null);
    }
  }

  if (businessLoading) return <LoadingSpinner />;
  if (!businessId) return <NoBusinessState />;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <StickyHeader>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
          <div>
            <h1 className="text-lg font-bold text-foreground sm:text-2xl">Catat Faktur Utang</h1>
            <Link href="/dashboard/ledger" className="text-xs font-medium text-primary hover:underline">
              Lihat Daftar Piutang/Hutang &rarr;
            </Link>
          </div>
          <div className="rounded-xl border border-default-200 bg-default-50 px-3 py-1.5 text-right sm:rounded-2xl sm:px-5 sm:py-2.5">
            <p className="text-[9px] font-bold uppercase tracking-wide text-default-500 sm:text-[10px] sm:tracking-wider">
              Total Faktur
            </p>
            <p className="text-sm font-bold text-foreground sm:text-lg">{formatCurrency(Number(amount) || 0)}</p>
          </div>
        </div>
      </StickyHeader>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <LocationSelect
          label="Lokasi"
          businessId={businessId}
          selectedId={locationId}
          onSelect={(id) => setLocationId(id)}
          onCreateNew={(query) => {
            setLocationModalQuery(query);
            setLocationModalOpen(true);
          }}
          createNewLabel={(q) => `Tambah "${q}" sebagai lokasi baru`}
          refreshToken={locationRefreshToken}
          isRequired
        />

        <AsyncSearchSelect
          label="Pelanggan"
          placeholder="Cari pelanggan..."
          selectedId={partyId}
          selectedLabel={partyLabel}
          onSelect={(id, label) => {
            setPartyId(id);
            setPartyLabel(label);
          }}
          fetchOptions={fetchPartyOptions}
          onCreateNew={(query) => {
            setContactModalQuery(query);
            setContactModalOpen(true);
          }}
          createNewLabel={(q) => `Tambah "${q}" sebagai pelanggan baru`}
          isRequired
        />
      </div>

      <CurrencyInput label="Nominal Utang" value={amount} onValueChange={setAmount} isRequired />

      <InvoiceAttachmentsUploader
        businessId={businessId}
        stagedFiles={stagedAttachments}
        onStagedFilesChange={setStagedAttachments}
      />

      <Textarea
        label="Catatan (opsional)"
        placeholder="Catatan tambahan untuk faktur ini..."
        value={note}
        onValueChange={setNote}
      />

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          variant="flat"
          className="h-auto min-h-11 flex-1 whitespace-normal py-2.5"
          isLoading={savingAction === 'draft'}
          isDisabled={savingAction !== null}
          onPress={() => handleSubmit(false)}
        >
          Simpan sebagai Draft
        </Button>
        <Button
          color="primary"
          className="h-auto min-h-11 flex-1 whitespace-normal py-2.5"
          isLoading={savingAction === 'submit'}
          isDisabled={savingAction !== null}
          onPress={() => handleSubmit(true)}
        >
          Simpan & Submit
        </Button>
      </div>

      {businessId && (
        <QuickAddContactModal
          isOpen={contactModalOpen}
          onClose={() => setContactModalOpen(false)}
          businessId={businessId}
          type="customer"
          initialName={contactModalQuery}
          onCreated={(contact) => {
            setPartyId(contact.id);
            setPartyLabel(contact.name);
          }}
        />
      )}

      {businessId && (
        <QuickAddLocationModal
          isOpen={locationModalOpen}
          onClose={() => setLocationModalOpen(false)}
          businessId={businessId}
          initialName={locationModalQuery}
          onCreated={(location) => {
            setLocationId(location.id);
            setLocationRefreshToken((n) => n + 1);
          }}
        />
      )}
    </div>
  );
}
