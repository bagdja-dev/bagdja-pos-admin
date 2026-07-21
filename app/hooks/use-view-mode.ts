'use client';

import { useCallback, useEffect, useState } from 'react';

export type ViewMode = 'card' | 'table' | 'auto';

const DESKTOP_QUERY = '(min-width: 1024px)';

function isViewMode(value: string | null): value is ViewMode {
  return value === 'card' || value === 'table' || value === 'auto';
}

/**
 * Preferensi tampilan (kartu/tabel/otomatis) untuk daftar per-lokasi di
 * kas, piutang, dan omzet — disimpan per halaman lewat `storageKey` supaya
 * pilihan user tidak reset tiap pindah halaman. "Otomatis" mengikuti lebar
 * layar: kartu di mobile, tabel di layar besar (>=1024px).
 */
export function useViewMode(storageKey: string) {
  const [mode, setModeState] = useState<ViewMode>('auto');
  const [isDesktop, setIsDesktop] = useState(true);

  useEffect(() => {
    const stored = window.localStorage.getItem(storageKey);
    if (isViewMode(stored)) setModeState(stored);
  }, [storageKey]);

  useEffect(() => {
    const mql = window.matchMedia(DESKTOP_QUERY);
    setIsDesktop(mql.matches);
    const onChange = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  const setMode = useCallback(
    (next: ViewMode) => {
      setModeState(next);
      window.localStorage.setItem(storageKey, next);
    },
    [storageKey],
  );

  const showCards = mode === 'card' || (mode === 'auto' && !isDesktop);

  return { mode, setMode, showCards };
}
