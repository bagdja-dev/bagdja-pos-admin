'use client';

import { useEffect, useRef, useState } from 'react';
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

  useEffect(() => {
    if (!isOpen) return;

    setError(null);
    const scanner = new Html5Qrcode(SCANNER_ELEMENT_ID);
    let stopped = false;

    scanner
      .start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          if (stopped) return;
          stopped = true;
          onScanRef.current(decodedText);
        },
        () => {
          // decode gagal per-frame, abaikan — normal saat kamera belum fokus ke kode
        },
      )
      .catch(() => {
        setError('Tidak bisa mengakses kamera. Pastikan izin kamera sudah diberikan ke browser.');
      });

    return () => {
      stopped = true;
      scanner.stop().then(() => scanner.clear()).catch(() => {});
    };
  }, [isOpen]);

  return (
    <AppModal isOpen={isOpen} onClose={onClose} title="Scan Barcode / QR Code" size="sm">
      <div className="space-y-3">
        <div id={SCANNER_ELEMENT_ID} className="w-full overflow-hidden rounded-lg bg-default-100" />
        {error && <p className="text-sm text-danger">{error}</p>}
        <p className="text-xs text-default-500">Arahkan kamera ke barcode atau QR code pada produk.</p>
      </div>
    </AppModal>
  );
}
