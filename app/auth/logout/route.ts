import { NextResponse } from 'next/server';

import { clearSession } from '../../lib/session';
import { buildSsoLogoutUrl } from '../../lib/app-url';

export async function GET() {
  await clearSession();
  return NextResponse.redirect(buildSsoLogoutUrl());
}
