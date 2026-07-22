/** Cookie biasa (bukan httpOnly) — sengaja bisa dibaca/ditulis dari client, dan otomatis
 * ikut ke-attach di request same-origin ke `/api/proxy/**`, lihat proxy route.ts. */
export function getCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : undefined;
}

export function setCookie(name: string, value: string, maxAgeDays = 365) {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAgeDays * 24 * 60 * 60}; SameSite=Lax`;
}
