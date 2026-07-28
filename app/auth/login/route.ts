import { NextRequest, NextResponse } from 'next/server';
import { generateCodeVerifier, generateCodeChallenge, buildAuthorizeUrl } from '../../lib/auth';
import { encryptOAuthState } from '../../lib/oauth-state';

function safeNextPath(next: string | null): string | null {
  if (!next || !next.startsWith('/') || next.startsWith('//')) return null;
  return next;
}

const STATE_ENCRYPTION_KEY = process.env.OAUTH_STATE_ENCRYPTION_KEY ?? '';

export async function GET(request: NextRequest) {
  if (!STATE_ENCRYPTION_KEY) {
    console.error('OAUTH_STATE_ENCRYPTION_KEY belum di-set di environment');
    return NextResponse.redirect(new URL('/?error=server_misconfigured', request.url));
  }

  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);
  const next = safeNextPath(request.nextUrl.searchParams.get('next'));

  // code_verifier + next path dienkripsi ke dalam `state` (bukan cookie) —
  // supaya tidak bergantung pada cookie yang di-set sebelum redirect
  // bertahan lintas navigasi ke IdP dan balik lagi (lihat oauth-state.ts).
  const state = encryptOAuthState({ codeVerifier, next }, STATE_ENCRYPTION_KEY);

  const authorizeUrl = buildAuthorizeUrl(state, codeChallenge);
  return NextResponse.redirect(authorizeUrl);
}
