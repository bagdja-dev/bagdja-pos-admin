'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { NextIntlClientProvider } from 'next-intl';

import { useBusinessContext } from '../context/business-context';
import idMessages from '../../messages/id.json';

type Messages = Record<string, unknown>;

const DEFAULT_LOCALE = 'id-ID';

// Katalog non-default di-dynamic-import, bukan static import semua sekaligus
// — app ini PWA/TWA yang diinstall di HP, jangan bebani semua bisnis unduh
// katalog bahasa yang tidak mereka pakai begitu makin banyak bahasa ditambah.
const MESSAGE_LOADERS: Record<string, () => Promise<{ default: Messages }>> = {
  // 'ms-MY': () => import('../../messages/ms.json'),
};

/**
 * Bahasa UI mengikuti locale BISNIS aktif (bukan per-user) — satu toko fisik
 * biasanya satu bahasa staf, terlepas siapa yang login. Locale baru diketahui
 * SETELAH `/api/me` resolve (bukan dari URL), jadi provider ini ada di dalam
 * `BusinessProvider`, dan `id.json` di-static-import supaya render pertama
 * (sebelum business context resolve) langsung dapat Bahasa Indonesia tanpa
 * flash kosong — sesuai default kolom `locale` di DB.
 */
export function BusinessIntlProvider({ children }: { children: ReactNode }) {
  const { activeMembership } = useBusinessContext();
  const locale = activeMembership?.business.locale ?? DEFAULT_LOCALE;

  const [messages, setMessages] = useState<Messages>(idMessages);
  const [loadedLocale, setLoadedLocale] = useState(DEFAULT_LOCALE);

  useEffect(() => {
    if (locale === loadedLocale) return;
    const loader = MESSAGE_LOADERS[locale];
    if (!loader) {
      setMessages(idMessages);
      setLoadedLocale(DEFAULT_LOCALE);
      return;
    }
    let cancelled = false;
    loader().then((mod) => {
      if (!cancelled) {
        setMessages(mod.default);
        setLoadedLocale(locale);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [locale, loadedLocale]);

  useEffect(() => {
    document.documentElement.lang = loadedLocale.split('-')[0];
  }, [loadedLocale]);

  return (
    <NextIntlClientProvider locale={loadedLocale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}
