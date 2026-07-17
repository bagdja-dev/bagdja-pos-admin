import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';

import { Providers } from './providers';
import './globals.css';

export const metadata: Metadata = {
  title: 'Bagdja POS Admin',
  description: 'Tenant back-office untuk mengelola bisnis POS di platform Bagdja.',
};

// `maximumScale: 1` + `userScalable: false` mencegah browser mobile (terutama
// iOS Safari) auto-zoom saat fokus ke input teks yang font-size-nya < 16px —
// tanpa ini, tiap kali kasir/owner tap field di HP, halaman tiba-tiba zoom in
// sendiri dan harus di-pinch zoom-out manual tiap kali pindah field.
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
