'use client';

import { Button } from '@heroui/react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

const NAV_LINKS = [
  { href: '#features', label: 'Fitur' },
  { href: '#pricing', label: 'Harga' },
  { href: '#how-it-works', label: 'Cara Kerja' },
  { href: '#stats', label: 'Keunggulan' },
];

export function LandingNavbar() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <>
      <header className="glass fixed inset-x-0 top-0 z-50 border-b border-white/20">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-2">
            <button
              type="button"
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-gray-600 transition-colors hover:bg-gray-100 sm:hidden"
              aria-expanded={open}
              aria-controls="landing-mobile-menu"
              aria-label={open ? 'Tutup menu navigasi' : 'Buka menu navigasi'}
              onClick={() => setOpen((v) => !v)}
            >
              {open ? (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
                </svg>
              )}
            </button>

            <Link href="/" className="flex min-w-0 items-center" onClick={close}>
              <img src="/logo-full.png" alt="Bagdja POS" className="h-8 w-auto shrink-0" />
            </Link>
          </div>

          <nav className="hidden items-center gap-8 sm:flex" aria-label="Navigasi utama">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-2 sm:gap-4">
            <Link
              href="/auth/login"
              className="hidden text-sm font-medium text-gray-600 transition-colors hover:text-gray-900 sm:inline"
            >
              Masuk
            </Link>
            <Button
              as={Link}
              href="/auth/login"
              size="sm"
              className="hidden bg-gradient-to-r from-violet-600 to-purple-500 font-semibold text-white shadow-lg shadow-violet-500/25 sm:inline-flex"
            >
              Mulai Sekarang
            </Button>
            {!open && (
              <Button
                as={Link}
                href="/auth/login"
                size="sm"
                className="bg-gradient-to-r from-violet-600 to-purple-500 px-3 text-xs font-semibold text-white shadow-md shadow-violet-500/20 sm:hidden"
              >
                Mulai
              </Button>
            )}
          </div>
        </div>
      </header>

      {open && (
        <nav
          id="landing-mobile-menu"
          className="fixed inset-x-0 bottom-0 top-16 z-40 flex flex-col bg-white sm:hidden"
          aria-label="Menu mobile"
        >
          <div className="flex-1 overflow-y-auto px-4 py-6">
            <ul className="space-y-1">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="block rounded-lg px-3 py-3 text-lg font-medium text-gray-800 transition-colors hover:bg-gray-50"
                    onClick={close}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-4 border-t border-gray-100 pt-4">
              <Link
                href="/auth/login"
                className="block rounded-lg px-3 py-3 text-lg font-medium text-violet-600 transition-colors hover:bg-violet-50"
                onClick={close}
              >
                Masuk
              </Link>
            </div>
          </div>

          <div className="shrink-0 border-t border-gray-100 bg-white px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4">
            <Button
              as={Link}
              href="/auth/login"
              size="lg"
              className="w-full bg-gradient-to-r from-violet-600 to-purple-500 text-base font-semibold text-white shadow-lg shadow-violet-500/25"
              onPress={close}
            >
              Mulai Sekarang
            </Button>
          </div>
        </nav>
      )}
    </>
  );
}
