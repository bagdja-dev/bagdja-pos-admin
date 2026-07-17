import { NextRequest, NextResponse } from 'next/server';

import { getSession } from '../../../lib/session';

/**
 * Route khusus (bukan lewat /api/proxy generik) — pola sama seperti
 * payment-proof/route.ts — proxy JSON generik pakai `request.text()` +
 * `Content-Type: application/json` hardcoded, yang akan merusak body
 * multipart/form-data biner.
 */
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5006';

export async function POST(request: NextRequest) {
  const { token } = await getSession();
  if (!token) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  const businessId = request.nextUrl.searchParams.get('businessId');
  const invoiceId = request.nextUrl.searchParams.get('invoiceId');
  if (!businessId || !invoiceId) {
    return NextResponse.json({ error: 'businessId dan invoiceId wajib diisi' }, { status: 400 });
  }

  const incomingForm = await request.formData();
  const file = incomingForm.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'File wajib diunggah' }, { status: 400 });
  }

  const forwardForm = new FormData();
  forwardForm.append('file', file, file.name);

  const res = await fetch(`${API_BASE}/api/businesses/${businessId}/invoices/${invoiceId}/attachments`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: forwardForm,
  });

  const data = await res.json().catch(() => null);
  return NextResponse.json(data, { status: res.status });
}
