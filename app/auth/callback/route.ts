import { NextRequest, NextResponse } from 'next/server';
import { setSession } from '../../lib/session';
import { syncUserToBackend } from '../../lib/backend-api';
import { consumeOAuthState } from '../../lib/oauth-state-store';

const AUTH_URL = process.env.NEXT_PUBLIC_AUTH_URL ?? 'http://localhost:4001';
const CLIENT_ID = process.env.NEXT_PUBLIC_CLIENT_ID ?? 'bagdja-pos-admin';
const CLIENT_SECRET = process.env.OAUTH_CLIENT_SECRET ?? '';
const REDIRECT_URI = process.env.NEXT_PUBLIC_REDIRECT_URI ?? 'http://localhost:5007/auth/callback';
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5008';
const AUTO_SUBSCRIBE_ENABLED = process.env.AUTO_SUBSCRIBE_FREE_ENABLED !== 'false';

/**
 * Auto-subscribe user to free plan jika belum punya subscription.
 * Non-blocking pada login flow — jika gagal, user tetap bisa login.
 */
async function attemptAutoSubscribeFree(accessToken: string): Promise<void> {
  try {
    const res = await fetch(`${API_URL}/api/subscriptions/auto-subscribe-free`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      const errorBody = await res.text();
      console.warn(
        '[Auto-Subscribe] Non-blocking attempt failed (status: ' +
          res.status +
          '). Login continues anyway.',
      );
      console.warn('[Auto-Subscribe] Error:', errorBody);
      return;
    }

    const result = (await res.json()) as {
      autoSubscribed: boolean;
      reason?: string;
      subscription?: any;
    };

    if (result.autoSubscribed) {
      console.log('[Auto-Subscribe] Success: User auto-subscribed to free plan');
    } else {
      console.log('[Auto-Subscribe] Skipped:', result.reason || 'unknown reason');
    }
  } catch (err) {
    console.error(
      '[Auto-Subscribe] Network/parse error (non-blocking):',
      err instanceof Error ? err.message : String(err),
    );
    // Continue login anyway — auto-subscribe is non-blocking
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.redirect(new URL('/?error=auth_denied', request.url));
  }

  if (!code || !state) {
    return NextResponse.redirect(new URL('/?error=missing_params', request.url));
  }

  // code_verifier + next path dibaca dari Upstash Redis (sekali pakai, lalu
  // dihapus) — bukan dari cookie, supaya tidak terpengaruh Safari yang tidak
  // konsisten menyimpan Set-Cookie yang menempel di response redirect (lihat
  // login/route.ts).
  const decoded = await consumeOAuthState(state);

  if (!decoded) {
    return NextResponse.redirect(new URL('/?error=state_mismatch', request.url));
  }

  const codeVerifier = decoded.codeVerifier;

  try {
    const tokenRes = await fetch(`${AUTH_URL}/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        code,
        redirect_uri: REDIRECT_URI,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        code_verifier: codeVerifier,
      }),
    });

    if (!tokenRes.ok) {
      const errBody = await tokenRes.text();
      console.error('Token exchange failed:', errBody);
      return NextResponse.redirect(new URL('/?error=token_failed', request.url));
    }

    const data = await tokenRes.json();
    const accessToken: string = data.access_token;

    const payload = JSON.parse(Buffer.from(accessToken.split('.')[1], 'base64').toString());

    await setSession(accessToken, {
      userId: payload.sub ?? payload.userId,
      email: payload.email,
      username: payload.username,
    });

    // Sync user ke bagdja-pos-api DB (upsert pos_users via ClientAppGuard + JwtAuthGuard)
    await syncUserToBackend(accessToken);

    // Auto-subscribe to free plan jika feature enabled (non-blocking — login continues even if fails)
    if (AUTO_SUBSCRIBE_ENABLED) {
      await attemptAutoSubscribeFree(accessToken);
    } else {
      console.log('[Auto-Subscribe] Feature is disabled (AUTO_SUBSCRIBE_FREE_ENABLED=false)');
    }

    const nextPath = decoded.next;

    const redirectTo =
      nextPath && nextPath.startsWith('/') && !nextPath.startsWith('//') ? nextPath : '/dashboard';

    return NextResponse.redirect(new URL(redirectTo, request.url));
  } catch (err) {
    console.error('OAuth callback error:', err);
    return NextResponse.redirect(new URL('/?error=server_error', request.url));
  }
}
