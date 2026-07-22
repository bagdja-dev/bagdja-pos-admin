/**
 * Format angka sebagai mata uang sesuai currency/locale bisnis aktif (lihat
 * `useBusinessContext().activeMembership.business`). Sengaja TIDAK di-hardcode
 * `maximumFractionDigits` — itu asumsi khusus IDR (0 desimal); Intl.NumberFormat
 * sudah tahu MYR/THB/PHP pakai 2 desimal dari data CLDR bawaan, jadi override
 * manual yang lama justru salah untuk currency lain.
 */
export function formatCurrency(value: number | string, currency: string = 'IDR', locale: string = 'id-ID') {
  const numeric = typeof value === 'string' ? Number(value) : value;
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(numeric);
}
