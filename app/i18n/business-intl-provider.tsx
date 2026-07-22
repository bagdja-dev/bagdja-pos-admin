'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { NextIntlClientProvider } from 'next-intl';

import { getCookie } from '../lib/cookies';
import idMessages from '../../messages/id.json';

type Messages = Record<string, unknown>;

const DEFAULT_LOCALE = 'id-ID';
const LANG_COOKIE = 'lang';

// Katalog non-default di-dynamic-import, bukan static import semua sekaligus
// — app ini PWA/TWA yang diinstall di HP, jangan bebani semua bisnis unduh
// katalog bahasa yang tidak mereka pakai begitu makin banyak bahasa ditambah.
const MESSAGE_LOADERS: Record<string, () => Promise<{ default: Messages }>> = {
  'en-US': () => import('../../messages/en.json'),
  'ms-MY': () => import('../../messages/ms.json'),
  'fil-PH': () => import('../../messages/fil.json'),
  'vi-VN': () => import('../../messages/vi.json'),
};

/**
 * Bahasa UI adalah preferensi TAMPILAN, bukan data bisnis — disimpan di
 * cookie `lang` (bukan kolom `locale` di pos_businesses, yang dibiarkan ada
 * tapi tidak dipakai), supaya bisa dibaca lewat header di sisi backend juga
 * (proxy route ikut kirim `X-Locale`) tanpa perlu round-trip API di sini.
 * Ganti bahasa (lihat halaman Pengaturan) reload halaman — locale cuma
 * dibaca sekali saat mount, bukan reaktif terhadap perubahan cookie.
 */
export function BusinessIntlProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState(DEFAULT_LOCALE);
  const [messages, setMessages] = useState<Messages>(idMessages);

  useEffect(() => {
    const cookieLocale = getCookie(LANG_COOKIE) ?? DEFAULT_LOCALE;
    const loader = MESSAGE_LOADERS[cookieLocale];
    if (!loader) {
      setLocale(DEFAULT_LOCALE);
      setMessages(idMessages);
      return;
    }
    let cancelled = false;
    loader().then((mod) => {
      if (!cancelled) {
        setLocale(cookieLocale);
        setMessages(mod.default);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale.split('-')[0];
  }, [locale]);

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}
