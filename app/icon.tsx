import { ImageResponse } from 'next/og';

/**
 * Favicon/tab icon — Next.js App Router special file convention (dihasilkan
 * saat build, otomatis dipasang ke <head> tanpa perlu metadata.icons manual).
 * Logomark "B" sama seperti di landing-navbar.tsx & app/page.tsx supaya
 * konsisten satu identitas visual.
 */
export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 8,
          background: 'linear-gradient(to bottom right, #7c3aed, #a855f7)',
          color: 'white',
          fontSize: 20,
          fontWeight: 700,
          fontFamily: 'sans-serif',
        }}
      >
        B
      </div>
    ),
    { ...size },
  );
}
