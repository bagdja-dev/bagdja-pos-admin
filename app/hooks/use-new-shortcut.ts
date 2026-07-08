'use client';

import { useEffect } from 'react';

/**
 * Ctrl+N / Cmd+N global shortcut untuk trigger aksi "Tambah Baru" di halaman
 * list. `preventDefault()` supaya tidak kebuka "New Window" bawaan browser.
 * `enabled=false` (mis. modal lain sudah terbuka, atau user tidak punya izin
 * edit) menonaktifkan sementara tanpa perlu unmount listener.
 */
export function useNewShortcut(onNew: () => void, enabled = true) {
  useEffect(() => {
    if (!enabled) return;
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        onNew();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onNew, enabled]);
}
