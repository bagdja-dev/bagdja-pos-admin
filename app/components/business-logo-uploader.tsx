'use client';

import { useRef, useState, type ChangeEvent } from 'react';
import { Button } from '@heroui/react';
import { ImageUp, X } from 'lucide-react';

interface BusinessLogoUploaderProps {
  businessId: string;
  value: string;
  onChange: (url: string) => void;
}

/**
 * Upload langsung terjadi saat file dipilih (pola sama seperti
 * PaymentProofUploader) — hasil URL diisi ke `onChange`, pemanggil (halaman
 * Pengaturan) yang PATCH `logo_url` ke bisnis. Tidak pakai `capture` seperti
 * bukti transfer — logo biasanya file desain, bukan foto kamera.
 */
export function BusinessLogoUploader({ businessId, value, onChange }: BusinessLogoUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await fetch(`/api/uploads/business-logo?businessId=${businessId}`, {
        method: 'POST',
        body: form,
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message ?? data?.error ?? 'Gagal mengunggah logo');
      onChange(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengunggah logo');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <div className="space-y-2">
      <label className="px-1 text-xs font-medium text-default-600">Logo Bisnis</label>

      {value ? (
        <div className="relative inline-block overflow-hidden rounded-xl border border-default-200 bg-default-50">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="Logo bisnis" className="h-24 w-24 object-contain p-2" />
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white hover:bg-black/80"
            aria-label="Hapus logo"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <Button
          variant="flat"
          isLoading={uploading}
          startContent={!uploading ? <ImageUp className="h-4 w-4" /> : undefined}
          onPress={() => inputRef.current?.click()}
        >
          {uploading ? 'Mengunggah...' : 'Unggah Logo'}
        </Button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />

      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
