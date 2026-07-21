'use client';

import { Accordion, AccordionItem } from '@heroui/react';
import { Info } from 'lucide-react';
import type { ReactNode } from 'react';

/**
 * Bungkus keterangan panjang di bawah judul halaman supaya bisa
 * disembunyikan — di layar sempit, teks 2-3 baris ini gampang menghabiskan
 * ruang sticky header. Default tertutup, user tinggal expand kalau perlu.
 */
export function PageDescription({ children }: { children: ReactNode }) {
  return (
    <Accordion
      variant="light"
      className="px-0"
      itemClasses={{
        base: 'px-0',
        heading: 'py-0',
        trigger: 'gap-1.5 py-1',
        title: 'text-xs font-medium text-default-500',
        indicator: 'text-default-400',
        content: 'pb-2 pt-0.5 text-sm text-default-500',
      }}
    >
      <AccordionItem
        key="description"
        aria-label="Keterangan"
        title="Keterangan"
        startContent={<Info className="h-3.5 w-3.5 text-default-400" />}
      >
        {children}
      </AccordionItem>
    </Accordion>
  );
}
