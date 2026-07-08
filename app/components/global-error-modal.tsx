'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, X } from 'lucide-react';

import { setGlobalErrorHandler } from '../lib/error-bus';

interface ErrorState {
  message: string;
  status?: number;
}

/**
 * Modal error global — dipicu otomatis oleh `apiClient` (lewat `error-bus.ts`)
 * setiap kali panggilan API gagal, di mana pun dipanggil di aplikasi. Sengaja
 * dibuat mencolok (merah, ikon goyang, animasi pop-in) supaya tidak
 * kebablasan kelewat kalau cuma teks kecil di bawah form.
 */
export function GlobalErrorModal() {
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState<ErrorState | null>(null);

  useEffect(() => {
    setMounted(true);
    setGlobalErrorHandler((message, status) => setError({ message, status }));
    return () => setGlobalErrorHandler(null);
  }, []);

  useEffect(() => {
    if (!error) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setError(null);
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [error]);

  if (!mounted || !error) return null;

  const portalRoot = document.getElementById('modal-root') ?? document.body;

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        aria-label="Tutup"
        onClick={() => setError(null)}
      />

      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="global-error-title"
        className="animate-error-pop relative z-10 w-full max-w-sm overflow-hidden rounded-2xl border-2 border-danger bg-white shadow-2xl shadow-danger/30"
      >
        <div className="flex items-center justify-between bg-danger px-5 py-4">
          <div className="flex items-center gap-2 text-white">
            <AlertTriangle className="animate-error-shake h-6 w-6 shrink-0" />
            <h2 id="global-error-title" className="text-base font-bold">
              Terjadi Kesalahan
            </h2>
          </div>
          <button
            type="button"
            onClick={() => setError(null)}
            className="rounded-lg p-1 text-white/80 transition-colors hover:bg-white/20 hover:text-white"
            aria-label="Tutup"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-3 px-5 py-5">
          {error.status !== undefined && (
            <span className="inline-block rounded-full bg-danger-50 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-danger">
              HTTP {error.status}
            </span>
          )}
          <p className="text-sm leading-relaxed text-foreground">{error.message}</p>
        </div>

        <div className="flex justify-end border-t border-default-200 px-5 py-3">
          <button
            type="button"
            onClick={() => setError(null)}
            className="rounded-xl bg-danger px-5 py-2 text-sm font-bold text-white shadow-lg shadow-danger/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>,
    portalRoot,
  );
}
