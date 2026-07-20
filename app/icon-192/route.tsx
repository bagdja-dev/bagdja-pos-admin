import { ImageResponse } from 'next/og';

/**
 * Ikon PWA 192x192 — logomark "B" sama seperti `app/icon.tsx` (favicon) &
 * landing-navbar.tsx, dipakai `app/manifest.ts`. Route handler biasa (bukan
 * konvensi `icon.tsx`) karena manifest butuh beberapa ukuran sekaligus di
 * URL tetap, bukan satu favicon default.
 */
export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(to bottom right, #7c3aed, #a855f7)',
          color: 'white',
          fontSize: 110,
          fontWeight: 700,
          fontFamily: 'sans-serif',
        }}
      >
        B
      </div>
    ),
    { width: 192, height: 192 },
  );
}
