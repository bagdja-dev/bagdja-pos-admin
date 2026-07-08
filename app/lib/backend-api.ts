/**
 * Server-side helper to call bagdja-pos-api with session token from httpOnly cookie.
 */
import { getSession } from './session';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5006';

export async function backendFetch<T = unknown>(
  path: string,
  options: RequestInit = {},
): Promise<{ data: T | null; status: number; error?: string; errorBody?: unknown }> {
  const { token } = await getSession();

  if (!token) {
    return { data: null, status: 401, error: 'Not authenticated' };
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
    Authorization: `Bearer ${token}`,
  };

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
    });

    if (!res.ok) {
      // Backend (NestJS) selalu balas JSON terstruktur (`{message, error, statusCode}`)
      // — parse dulu supaya proxy bisa forward apa adanya, bukan dibungkus jadi
      // string ganda yang bikin apiClient cuma dapat teks JSON mentah.
      const text = await res.text();
      let errorBody: unknown = text;
      try {
        errorBody = JSON.parse(text);
      } catch {
        // bukan JSON, biarkan sebagai teks
      }
      return { data: null, status: res.status, error: text || res.statusText, errorBody };
    }

    if (res.status === 204) {
      return { data: null, status: res.status };
    }

    const data = (await res.json()) as T;
    return { data, status: res.status };
  } catch (err) {
    return {
      data: null,
      status: 500,
      error: err instanceof Error ? err.message : 'Request failed',
    };
  }
}

/**
 * Trigger user upsert di bagdja-pos-api (via GET /api/me) langsung setelah
 * OAuth callback, supaya pos_users terisi walau dashboard belum dimuat.
 */
export async function syncUserToBackend(accessToken: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/api/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      console.error('[syncUserToBackend] failed:', res.status, await res.text());
      return false;
    }

    return true;
  } catch (err) {
    console.error('[syncUserToBackend] error:', err);
    return false;
  }
}
