import type { ReactNode } from 'react';

/**
 * Bungkus header tiap halaman (judul + tombol aksi) supaya tetap terlihat
 * (`position: sticky`) saat konten di bawahnya (tabel/grid panjang) discroll
 * di dalam `<main>` (`dashboard/layout.tsx`) — sebelumnya SEMUA halaman
 * headernya ikut discroll bersama konten, cuma Topbar level-app yang sticky.
 * Sengaja komponen passthrough (`children` bebas, bukan prop title/subtitle/
 * action bertipe) karena bentuk header tiap halaman variatif (ada yang punya
 * tombol "kembali", chip status, kartu ringkasan, dll) — memaksa satu bentuk
 * slot yang kaku untuk semua akan lebih merepotkan daripada membungkus JSX
 * yang sudah ada apa adanya.
 */
export function StickyHeader({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`sticky top-0 z-10 border-b border-default-200 bg-background pb-3 ${className}`}>
      {children}
    </div>
  );
}
