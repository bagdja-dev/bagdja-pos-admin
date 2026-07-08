'use client';

import { useRef, useState, type ChangeEvent } from 'react';
import { Button } from '@heroui/react';
import { Camera, X } from 'lucide-react';

interface PaymentProofUploaderProps {
  businessId: string;
  value: string;
  onChange: (url: string) => void;
}

/**
 * Upload bukti transfer — `capture="environment"` bikin browser HP langsung
 * buka kamera belakang saat tombol ditekan (fallback ke file picker biasa di
 * desktop, dan tetap bisa pilih dari galeri di HP lewat opsi bawaan OS).
 * Upload langsung terjadi saat file dipilih, hasil URL-nya baru diisi ke
 * `onChange` — kasir tidak perlu tahu ada endpoint/URL sama sekali.
 */
export function PaymentProofUploader({ businessId, value, onChange }: PaymentProofUploaderProps) {
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
      const res = await fetch(`/api/uploads/payment-proof?businessId=${businessId}`, {
        method: 'POST',
        body: form,
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message ?? data?.error ?? 'Gagal mengunggah foto');
      onChange(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengunggah foto');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <div className="space-y-2">
      <label className="px-1 text-xs font-medium text-default-600">
        Bukti Transfer <span className="text-danger">*</span>
      </label>

      {value ? (
        <div className="relative overflow-hidden rounded-xl border border-default-200 bg-default-50">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="Bukti transfer" className="max-h-56 w-full object-contain" />
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white hover:bg-black/80"
            aria-label="Hapus foto"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <Button
          variant="flat"
          className="w-full"
          isLoading={uploading}
          startContent={!uploading ? <Camera className="h-4 w-4" /> : undefined}
          onPress={() => inputRef.current?.click()}
        >
          {uploading ? 'Mengunggah...' : 'Ambil / Unggah Foto Bukti'}
        </Button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />

      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
