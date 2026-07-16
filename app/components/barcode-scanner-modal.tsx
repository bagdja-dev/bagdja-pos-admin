'use client';

import { useCallback, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

import { AppModal } from './app-modal';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (value: string) => void;
}

const SCANNER_ELEMENT_ID = 'barcode-scanner-region';

export function BarcodeScannerModal({ isOpen, onClose, onScan }: BarcodeScannerModalProps) {
  const [error, setError] = useState<string | null>(null);
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannedRef = useRef(false);

  // Callback ref (bukan useEffect) karena elemen target di-render lewat
  // AppModal (portal + mounted-gate internal) — id-nya belum pasti ada di
  // DOM tepat saat komponen ini pertama kali render. Callback ref hanya
  // dipanggil React setelah node itu benar-benar ter-attach ke DOM, jadi
  // Html5Qrcode aman dikonstruksi di sini.
  const containerRef = useCallback((node: HTMLDivElement | null) => {
    if (!node) {
      scannerRef.current
        ?.stop()
        .then(() => scannerRef.current?.clear())
        .catch(() => {});
      scannerRef.current = null;
      return;
    }

    setError(null);
    scannedRef.current = false;
    const scanner = new Html5Qrcode(node.id);
    scannerRef.current = scanner;

    scanner
      .start(
        { facingMode: 'environment' },
        {
          fps: 10,
          // Fungsi (bukan angka tetap) supaya qrbox selalu proporsional dengan
          // ukuran video yang sebenarnya dirender — qrbox tetap yang lebih besar
          // dari viewfinder bikin area scan tidak sejajar dengan video, jadi
          // kamera terlihat jalan tapi tidak pernah berhasil membaca kode.
          qrbox: (viewfinderWidth, viewfinderHeight) => {
            const size = Math.floor(Math.min(viewfinderWidth, viewfinderHeight) * 0.7);
            return { width: size, height: size };
          },
        },
        (decodedText) => {
          if (scannedRef.current) return;
          scannedRef.current = true;
          onScanRef.current(decodedText);
        },
        () => {
          // decode gagal per-frame, abaikan — normal saat kamera belum fokus ke kode
        },
      )
      .catch(() => {
        setError('Tidak bisa mengakses kamera. Pastikan izin kamera sudah diberikan ke browser.');
      });
  }, []);

  return (
    <AppModal isOpen={isOpen} onClose={onClose} title="Scan Barcode / QR Code" size="sm">
      <div className="space-y-3">
        <div
          ref={containerRef}
          id={SCANNER_ELEMENT_ID}
          className="aspect-square w-full overflow-hidden rounded-lg bg-default-100"
        />
        {error && <p className="text-sm text-danger">{error}</p>}
        <p className="text-xs text-default-500">Arahkan kamera ke barcode atau QR code pada produk.</p>
      </div>
    </AppModal>
  );
}
