import { emitGlobalError } from './error-bus';

/**
 * Client-side API helper — calls admin BFF proxy (reads httpOnly token server-side).
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiClient<T = unknown>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  const res = await fetch(`/api/proxy${normalized}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    },
  });

  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = await res.json();
      const rawMessage = body.message ?? body.error;
      message = Array.isArray(rawMessage) ? rawMessage.join(', ') : (rawMessage ?? JSON.stringify(body));
    } catch {
      message = await res.text().catch(() => message);
    }
    emitGlobalError(message, res.status);
    throw new ApiError(message, res.status);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

/** Bangun query string standar grid (`page/size/search/sort/filter[key]`) dari params `DataGrid`. */
export function buildGridQueryString(params: {
  page: number;
  size: number;
  search?: string;
  sort?: string;
  filter?: Record<string, string>;
}): string {
  const qs = new URLSearchParams();
  qs.set('page', String(params.page));
  qs.set('size', String(params.size));
  if (params.search) qs.set('search', params.search);
  if (params.sort) qs.set('sort', params.sort);
  for (const [key, value] of Object.entries(params.filter ?? {})) {
    if (value) qs.set(`filter[${key}]`, value);
  }
  return qs.toString();
}
