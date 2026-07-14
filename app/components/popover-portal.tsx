'use client';

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import { createPortal } from 'react-dom';

interface PopoverPortalProps {
  anchorRef: RefObject<HTMLElement>;
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Lebar target popover (px) — dipakai untuk hitung posisi align-right supaya tidak keluar viewport. Diabaikan jika `matchAnchorWidth`. */
  width?: number;
  /** Jika true, lebar & posisi kiri popover mengikuti persis lebar anchor (mis. dropdown select) alih-alih align-kanan dengan `width` tetap. */
  matchAnchorWidth?: boolean;
}

/**
 * Render popover via portal ke `#modal-root` dengan `position: fixed` yang
 * dihitung dari bounding rect anchor — supaya tidak ke-clip oleh ancestor
 * manapun yang punya `overflow-hidden` (mis. layout dashboard), tidak seperti
 * `position: absolute` biasa. Tutup otomatis saat klik luar, Escape, resize,
 * atau scroll.
 */
export function PopoverPortal({ anchorRef, isOpen, onClose, children, width = 400, matchAnchorWidth = false }: PopoverPortalProps) {
  const [mounted, setMounted] = useState(false);
  const [style, setStyle] = useState<{ top: number; left: number; width: number } | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  useLayoutEffect(() => {
    if (!isOpen || !anchorRef.current) {
      setStyle(null);
      return;
    }

    const rect = anchorRef.current.getBoundingClientRect();
    const margin = 8;

    if (matchAnchorWidth) {
      setStyle({ top: rect.bottom + margin, left: rect.left, width: rect.width });
      return;
    }

    let left = rect.right - width;
    left = Math.max(margin, Math.min(left, window.innerWidth - width - margin));

    setStyle({ top: rect.bottom + margin, left, width });
  }, [isOpen, anchorRef, width, matchAnchorWidth]);

  useEffect(() => {
    if (!isOpen) return;

    function handleOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (popoverRef.current?.contains(target) || anchorRef.current?.contains(target)) return;
      onClose();
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    function handleReposition(e: Event) {
      // Scroll di dalam popover sendiri (mis. list hasil pencarian) tidak boleh
      // menutup popover — event `scroll` tidak bubble tapi tetap kena listener
      // capture-phase ini, jadi tanpa guard ini scroll di list langsung menutup
      // dropdown-nya (terasa seperti "tidak bisa discroll", terutama di mobile).
      if (popoverRef.current?.contains(e.target as Node)) return;
      onClose();
    }

    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleKey);
    window.addEventListener('resize', handleReposition);
    window.addEventListener('scroll', handleReposition, true);

    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleKey);
      window.removeEventListener('resize', handleReposition);
      window.removeEventListener('scroll', handleReposition, true);
    };
  }, [isOpen, onClose, anchorRef]);

  if (!mounted || !isOpen || !style) return null;

  const portalRoot = document.getElementById('modal-root') ?? document.body;

  return createPortal(
    <div
      ref={popoverRef}
      style={{ position: 'fixed', top: style.top, left: style.left, width: style.width, zIndex: 100 }}
    >
      {children}
    </div>,
    portalRoot,
  );
}
