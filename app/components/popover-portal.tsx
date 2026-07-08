'use client';

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import { createPortal } from 'react-dom';

interface PopoverPortalProps {
  anchorRef: RefObject<HTMLElement>;
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Lebar target popover (px) — dipakai untuk hitung posisi align-right supaya tidak keluar viewport. */
  width?: number;
}

/**
 * Render popover via portal ke `#modal-root` dengan `position: fixed` yang
 * dihitung dari bounding rect anchor — supaya tidak ke-clip oleh ancestor
 * manapun yang punya `overflow-hidden` (mis. layout dashboard), tidak seperti
 * `position: absolute` biasa. Tutup otomatis saat klik luar, Escape, resize,
 * atau scroll.
 */
export function PopoverPortal({ anchorRef, isOpen, onClose, children, width = 400 }: PopoverPortalProps) {
  const [mounted, setMounted] = useState(false);
  const [style, setStyle] = useState<{ top: number; left: number } | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  useLayoutEffect(() => {
    if (!isOpen || !anchorRef.current) {
      setStyle(null);
      return;
    }

    const rect = anchorRef.current.getBoundingClientRect();
    const margin = 8;
    let left = rect.right - width;
    left = Math.max(margin, Math.min(left, window.innerWidth - width - margin));

    setStyle({ top: rect.bottom + margin, left });
  }, [isOpen, anchorRef, width]);

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
    function handleReposition() {
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
      style={{ position: 'fixed', top: style.top, left: style.left, width, zIndex: 100 }}
    >
      {children}
    </div>,
    portalRoot,
  );
}
