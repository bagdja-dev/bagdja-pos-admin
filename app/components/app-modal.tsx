'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

type AppModalSize = 'sm' | 'md' | 'lg' | 'xl';

interface AppModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: AppModalSize;
}

const SIZE_CLASS: Record<AppModalSize, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
};

// Stack modul-level dari modal yang sedang terbuka — AppModal bisa bersarang
// (mis. AsyncSearchSelect dipakai sebagai salah satu filter di dalam AppModal
// Filter DataGrid, dan keduanya sama-sama AppModal). Listener `keydown` tiap
// instance dipasang langsung ke `document`, jadi satu tombol Escape akan kena
// SEMUA listener yang aktif tanpa stack ini — bukan cuma modal paling atas.
// Stack ini memastikan Escape cuma menutup modal ter-atas/paling baru dibuka.
const openModalStack: symbol[] = [];

export function AppModal({ isOpen, onClose, title, children, footer, size = 'md' }: AppModalProps) {
  const [mounted, setMounted] = useState(false);
  const idRef = useRef(Symbol('app-modal'));

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && openModalStack[openModalStack.length - 1] === idRef.current) onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (!isOpen) return;

    const id = idRef.current;
    openModalStack.push(id);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      openModalStack.splice(openModalStack.indexOf(id), 1);
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, handleKeyDown]);

  if (!mounted || !isOpen) return null;

  const portalRoot = document.getElementById('modal-root') ?? document.body;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6">
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
        aria-label="Tutup modal"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="app-modal-title"
        className={`relative z-10 flex w-full flex-col ${SIZE_CLASS[size]} max-h-[calc(100vh-2rem)] overflow-hidden rounded-2xl border border-default-200 bg-white shadow-2xl`}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-default-200 px-5 py-4 sm:px-6">
          <h2 id="app-modal-title" className="text-lg font-semibold text-foreground">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-default-400 transition-colors hover:bg-default-100 hover:text-foreground"
            aria-label="Tutup"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">{children}</div>

        {footer && (
          <div className="flex shrink-0 justify-end gap-2 border-t border-default-200 px-5 py-4 sm:px-6">
            {footer}
          </div>
        )}
      </div>
    </div>,
    portalRoot,
  );
}
