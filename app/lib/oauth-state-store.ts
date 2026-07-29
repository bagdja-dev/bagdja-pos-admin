/**
 * Penyimpanan `code_verifier` + `next` path sisi server (Upstash Redis),
 * dikunci oleh ID pendek acak yang dikirim sebagai `state` OAuth.
 *
 * Kenapa bukan cookie: Safari (semua mode, termasuk private) tidak konsisten
 * menyimpan Set-Cookie yang menempel di response redirect — cookie yang
 * di-set di /auth/login sebelum redirect ke IdP kadang tidak kebaca lagi di
 * /auth/callback, menyebabkan state_mismatch di iOS meski Chrome/Android
 * normal.
 *
 * Kenapa bukan `state` terenkripsi (desain sebelumnya, lihat riwayat git) —
 * blob terenkripsi ~250 karakter high-entropy di query string lintas domain
 * beberapa kali ke-flag ekstensi ad-blocker/privacy sebagai pola tracking
 * token, bikin request ke IdP gagal di level koneksi (bukan error aplikasi)
 * buat sebagian user tanpa mereka sadari itu ekstensi mereka sendiri. `state`
 * sekarang cuma ID pendek (~24 karakter) — bentuknya sama seperti token sesi
 * biasa, jauh lebih kecil kemungkinan ke-flag.
 *
 * **Titik ganti untuk Docker on-premise** (lihat `plan.md` Bagian "Opsi
 * On-Premise"): `getRedisClient()` di bawah ini SATU-SATUNYA tempat yang
 * tahu soal Upstash. Kalau nanti perlu jalan tanpa Upstash (mis. self-hosted
 * Redis biasa di docker-compose), cukup ganti isi fungsi ini jadi client
 * `ioredis` yang connect ke `REDIS_URL` — `saveOAuthState()`/
 * `consumeOAuthState()` dan pemanggilnya (`/auth/login`, `/auth/callback`)
 * tidak perlu berubah sama sekali.
 */
import crypto from 'crypto';
import { Redis } from '@upstash/redis';

const STATE_KEY_PREFIX = 'oauth_state:';
const DEFAULT_TTL_SECONDS = 600;

export interface AdminOAuthStatePayload {
  codeVerifier: string;
  next: string | null;
}

let cachedClient: Redis | null | undefined;

/**
 * Terima dua konvensi nama env var — `KV_REST_API_URL`/`KV_REST_API_TOKEN`
 * (dipakai Vercel Marketplace waktu connect provider apa pun termasuk
 * Upstash, demi kompatibilitas mundur dengan `@vercel/kv`) atau
 * `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN` (penamaan asli
 * Upstash kalau di-provision langsung tanpa lewat Marketplace Vercel).
 */
function getRedisClient(): Redis | null {
  if (cachedClient !== undefined) return cachedClient;

  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

  cachedClient = url && token ? new Redis({ url, token }) : null;
  return cachedClient;
}

/** ID pendek acak (~24 karakter base64url) — dikirim sebagai `state` ke IdP. */
export function generateStateId(): string {
  return crypto.randomBytes(18).toString('base64url');
}

export async function saveOAuthState(
  id: string,
  payload: AdminOAuthStatePayload,
  ttlSeconds = DEFAULT_TTL_SECONDS,
): Promise<boolean> {
  const redis = getRedisClient();
  if (!redis) return false;
  // Kirim object langsung (bukan JSON.stringify manual) — SDK @upstash/redis
  // otomatis JSON-encode saat SET dan JSON-decode saat GET/GETDEL (diverifikasi
  // langsung terhadap instance Upstash asli, bukan asumsi dari dokumentasi).
  await redis.set(`${STATE_KEY_PREFIX}${id}`, payload, { ex: ttlSeconds });
  return true;
}

/** Sekali pakai — baca lalu langsung hapus (`GETDEL`, atomik) supaya `state` tidak bisa dipakai ulang (replay). */
export async function consumeOAuthState(id: string): Promise<AdminOAuthStatePayload | null> {
  const redis = getRedisClient();
  if (!redis) return null;

  const raw = await redis.getdel<AdminOAuthStatePayload | string>(`${STATE_KEY_PREFIX}${id}`);
  if (!raw) return null;

  try {
    // SDK biasanya sudah mengembalikan object ter-decode — `JSON.parse` cuma
    // jaga-jaga kalau suatu saat baca value berbentuk string mentah.
    const payload = typeof raw === 'string' ? (JSON.parse(raw) as AdminOAuthStatePayload) : raw;
    if (!payload?.codeVerifier) return null;
    return payload;
  } catch {
    return null;
  }
}
