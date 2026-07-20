import { ImageResponse } from 'next/og';

/** Ikon PWA 512x512 — lihat catatan di `app/icon-192/route.tsx`. */
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
          fontSize: 290,
          fontWeight: 700,
          fontFamily: 'sans-serif',
        }}
      >
        B
      </div>
    ),
    { width: 512, height: 512 },
  );
}
