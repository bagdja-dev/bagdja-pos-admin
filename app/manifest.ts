import type { MetadataRoute } from 'next';

/**
 * Web App Manifest — bikin admin bisa "Add to Home Screen"/di-install
 * sebagai PWA. Nama "POS Dashboard" sesuai penamaan resmi 3-app family
 * (lihat pos-lite-plan.md Bagian 0) — beda dari "Kasir" (app standalone
 * offline) supaya konsisten dengan produk lain yang terhubung ke akun cloud.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Bagdja POS Dashboard',
    short_name: 'POS Dashboard',
    description: 'Kelola faktur, stok, kas, dan laporan bisnis Bagdja POS Anda.',
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#7c3aed',
    orientation: 'portrait-primary',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
