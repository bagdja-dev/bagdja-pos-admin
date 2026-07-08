/**
 * Pub-sub singleton super tipis — `apiClient` (fungsi biasa, bukan komponen)
 * butuh cara memicu modal error global tanpa import React Context langsung.
 * `GlobalErrorModal` daftar sebagai satu-satunya handler saat mount.
 */
type ErrorHandler = (message: string, status?: number) => void;

let handler: ErrorHandler | null = null;

export function setGlobalErrorHandler(fn: ErrorHandler | null) {
  handler = fn;
}

export function emitGlobalError(message: string, status?: number) {
  handler?.(message, status);
}
