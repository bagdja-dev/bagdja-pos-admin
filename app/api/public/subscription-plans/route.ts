import { NextResponse } from 'next/server';

/**
 * Public proxy untuk daftar plan aktif Bagdja POS — dipakai landing
 * `#pricing` (tidak perlu login). Server-side fetch ke pos-api supaya
 * browser tidak perlu tahu `NEXT_PUBLIC_API_URL` / CORS client-token.
 */
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5006';

export async function GET() {
  try {
    const response = await fetch(`${API_BASE}/api/subscriptions/plans`, {
      // Landing sebaiknya cukup fresh; jangan cache lama di edge.
      cache: 'no-store',
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      return NextResponse.json(
        { message: text || 'Failed to fetch subscription plans' },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Upstream unreachable';
    return NextResponse.json({ message }, { status: 502 });
  }
}
