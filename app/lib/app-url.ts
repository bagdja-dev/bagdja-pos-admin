/**
 * App base URL (without /auth/callback).
 */
export function getAppUrl(): string {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '');
  }

  const redirectUri = process.env.NEXT_PUBLIC_REDIRECT_URI ?? 'http://localhost:5007/auth/callback';
  return redirectUri.replace(/\/auth\/callback\/?$/, '') || 'http://localhost:5007';
}

/**
 * Bagdja Login (SSO UI) base URL — pakai metode sama seperti bagdja-website:
 * satu variabel NEXT_PUBLIC_AUTH_URL untuk /oauth/authorize, /oauth/token,
 * DAN /logout (di production ketiganya di-proxy jadi satu domain).
 */
export function getLoginUrl(): string {
  return (process.env.NEXT_PUBLIC_AUTH_URL ?? 'http://localhost:4001').replace(/\/$/, '');
}

/**
 * Build SSO logout URL — clears shared auth cookie on bagdja-login
 * then redirects back to the app landing page.
 */
export function buildSsoLogoutUrl(returnTo?: string): string {
  const url = new URL('/logout', getLoginUrl());
  url.searchParams.set('redirect_uri', returnTo ?? getAppUrl());
  return url.toString();
}
