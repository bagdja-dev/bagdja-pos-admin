import { NextResponse } from 'next/server';

/**
 * Liveness probe untuk Coolify healthcheck. Tidak ada precedent Next.js
 * lain di ekosistem Bagdja (semua service Dockerized sejauh ini adalah
 * NestJS dengan GET /health — lihat api/src/modules/health/health.controller.ts)
 * — bentuk response disamakan supaya konsisten.
 */
export async function GET() {
  return NextResponse.json({
    service: 'bagdja-pos-admin',
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
}
