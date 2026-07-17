'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@heroui/react';
import { File as FileIcon, FileText, Image as ImageIcon, Paperclip, X } from 'lucide-react';

import { apiClient, ApiError } from '../lib/api-client';
import type { PosInvoiceAttachment } from '../lib/types';

interface InvoiceAttachmentsUploaderProps {
  businessId: string;
  /**
   * Kalau diisi ("mode live") — komponen fetch/upload/hapus langsung ke API.
   * Kalau kosong ("mode staging", dipakai di form Buat Faktur sebelum
   * faktur-nya sendiri ada id-nya) — file cuma disimpan lokal via
   * `stagedFiles`/`onStagedFilesChange`, diupload belakangan oleh caller
   * (loop upload) setelah faktur berhasil dibuat.
   */
  invoiceId?: string;
  stagedFiles?: File[];
  onStagedFilesChange?: (files: File[]) => void;
  /** Mode lihat saja (dipakai halaman detail faktur) — sembunyikan tombol tambah/hapus, cuma tampilkan link buka file. Kalau tidak ada lampiran, komponen tidak render apa-apa. */
  readOnly?: boolean;
}

const ACCEPT_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'application/pdf'];
const ACCEPT = ACCEPT_TYPES.join(',');
const MAX_BYTES = 10 * 1024 * 1024;

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FileTypeIcon({ mimeType }: { mimeType: string }) {
  if (mimeType === 'application/pdf') return <FileText className="h-5 w-5 shrink-0 text-danger" />;
  if (mimeType.startsWith('image/')) return <ImageIcon className="h-5 w-5 shrink-0 text-primary" />;
  return <FileIcon className="h-5 w-5 shrink-0 text-default-400" />;
}

/**
 * Upload lampiran faktur asli (foto/scan/PDF) — bisa lebih dari satu file
 * sekaligus. Lihat penjelasan mode "live" vs "staging" di prop `invoiceId`.
 */
export function InvoiceAttachmentsUploader({
  businessId,
  invoiceId,
  stagedFiles = [],
  onStagedFilesChange,
  readOnly = false,
}: InvoiceAttachmentsUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const isLive = Boolean(invoiceId);

  const [attachments, setAttachments] = useState<PosInvoiceAttachment[]>([]);
  const [loading, setLoading] = useState(isLive);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLive || !invoiceId) return;
    setLoading(true);
    apiClient<PosInvoiceAttachment[]>(`/api/businesses/${businessId}/invoices/${invoiceId}/attachments`)
      .then(setAttachments)
      .catch(() => setAttachments([]))
      .finally(() => setLoading(false));
  }, [businessId, invoiceId, isLive]);

  function validateFiles(files: File[]): File[] {
    const valid: File[] = [];
    for (const file of files) {
      if (!ACCEPT_TYPES.includes(file.type)) {
        setError(`"${file.name}" ditolak — format harus gambar (JPEG/PNG/WebP/HEIC) atau PDF`);
        continue;
      }
      if (file.size > MAX_BYTES) {
        setError(`"${file.name}" ditolak — ukuran maksimal 10 MB`);
        continue;
      }
      valid.push(file);
    }
    return valid;
  }

  async function handleFilesSelected(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    setError(null);
    const files = validateFiles(Array.from(fileList));
    if (inputRef.current) inputRef.current.value = '';
    if (files.length === 0) return;

    if (!isLive) {
      onStagedFilesChange?.([...stagedFiles, ...files]);
      return;
    }

    setUploading(true);
    try {
      for (const file of files) {
        const form = new FormData();
        form.append('file', file);
        const res = await fetch(`/api/uploads/invoice-attachment?businessId=${businessId}&invoiceId=${invoiceId}`, {
          method: 'POST',
          body: form,
        });
        const data = await res.json().catch(() => null);
        if (!res.ok) throw new Error(data?.message ?? data?.error ?? `Gagal mengunggah "${file.name}"`);
        setAttachments((prev) => [...prev, data]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengunggah lampiran');
    } finally {
      setUploading(false);
    }
  }

  async function handleRemoveLive(attachment: PosInvoiceAttachment) {
    if (!invoiceId) return;
    if (!confirm(`Hapus lampiran "${attachment.file_name}"?`)) return;
    try {
      await apiClient(`/api/businesses/${businessId}/invoices/${invoiceId}/attachments/${attachment.id}`, {
        method: 'DELETE',
      });
      setAttachments((prev) => prev.filter((a) => a.id !== attachment.id));
    } catch (err) {
      alert(err instanceof ApiError ? err.message : 'Gagal menghapus lampiran');
    }
  }

  function handleRemoveStaged(index: number) {
    onStagedFilesChange?.(stagedFiles.filter((_, i) => i !== index));
  }

  const items = isLive ? attachments : stagedFiles;

  // Mode lihat saja: kalau belum selesai loading, tampilkan status singkat;
  // kalau sudah selesai dan kosong, tidak render apa-apa (tidak ada yang perlu ditampilkan).
  if (readOnly) {
    if (loading) return <p className="text-sm text-default-400">Memuat lampiran...</p>;
    if (attachments.length === 0) return null;
  }

  return (
    <div className="space-y-2">
      <label className="px-1 text-xs font-medium text-default-600">
        Lampiran Faktur Asli{!readOnly && ' (opsional)'}
      </label>

      {loading ? (
        <p className="text-sm text-default-400">Memuat lampiran...</p>
      ) : items.length > 0 ? (
        <div className="space-y-2">
          {isLive
            ? attachments.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center gap-2 rounded-lg border border-default-200 bg-default-50 px-3 py-2"
                >
                  <FileTypeIcon mimeType={a.mime_type} />
                  <a
                    href={a.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 truncate text-sm text-primary hover:underline"
                  >
                    {a.file_name}
                  </a>
                  {!readOnly && (
                    <button
                      type="button"
                      onClick={() => handleRemoveLive(a)}
                      className="rounded p-1 text-default-400 hover:bg-default-200 hover:text-danger"
                      aria-label="Hapus lampiran"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))
            : stagedFiles.map((file, i) => (
                <div
                  key={`${file.name}-${i}`}
                  className="flex items-center gap-2 rounded-lg border border-default-200 bg-default-50 px-3 py-2"
                >
                  <FileTypeIcon mimeType={file.type} />
                  <span className="flex-1 truncate text-sm text-foreground">{file.name}</span>
                  <span className="shrink-0 text-xs text-default-400">{formatBytes(file.size)}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveStaged(i)}
                    className="rounded p-1 text-default-400 hover:bg-default-200 hover:text-danger"
                    aria-label="Hapus file"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
        </div>
      ) : null}

      {!readOnly && (
        <>
          <Button
            variant="flat"
            size="sm"
            isLoading={uploading}
            startContent={!uploading ? <Paperclip className="h-4 w-4" /> : undefined}
            onPress={() => inputRef.current?.click()}
          >
            {uploading ? 'Mengunggah...' : 'Tambah Lampiran'}
          </Button>
          <p className="text-xs text-default-400">Gambar atau PDF, maksimal 10 MB per file, bisa pilih lebih dari satu sekaligus.</p>

          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT}
            multiple
            className="hidden"
            onChange={(e) => handleFilesSelected(e.target.files)}
          />
        </>
      )}

      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}
