'use client';

import { Input } from '@heroui/react';

interface CurrencyInputProps {
  label?: string;
  value: string | number;
  onValueChange: (raw: string) => void;
  placeholder?: string;
  isRequired?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  /** Warna teks relatif terhadap harga default — `up` (lebih mahal) biru, `down` (lebih murah) merah. */
  tone?: 'up' | 'down' | 'neutral';
}

const TONE_CLASS: Record<'up' | 'down' | 'neutral', string> = {
  up: 'text-primary',
  down: 'text-danger',
  neutral: 'text-foreground',
};

function toDigits(value: string | number): string {
  const num = typeof value === 'number' ? value : parseFloat(value || '0');
  if (!Number.isFinite(num) || num === 0) return '';
  return String(Math.round(num));
}

function groupThousands(digits: string): string {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/**
 * Input harga bermasking ala Indonesia (`#.###,00`) — grup ribuan live saat
 * mengetik lewat `startContent`/`endContent`; `,00` selalu tampil sebagai
 * suffix visual, bukan bagian teks yang bisa diedit (harga di Bagdja POS
 * selalu bulat rupiah, tanpa sen).
 */
export function CurrencyInput({ label, value, onValueChange, placeholder, isRequired, className, size = 'md', tone = 'neutral' }: CurrencyInputProps) {
  function handleChange(v: string) {
    const digits = v.replace(/\D/g, '').replace(/^0+(?=\d)/, '');
    onValueChange(digits);
  }

  return (
    <Input
      label={label}
      value={groupThousands(toDigits(value))}
      onValueChange={handleChange}
      onFocus={(e) => e.target.select()}
      placeholder={placeholder ?? '0'}
      isRequired={isRequired}
      className={className}
      size={size}
      inputMode="numeric"
      classNames={{ input: `text-right font-mono ${TONE_CLASS[tone]}` }}
      startContent={<span className="text-sm text-default-400">Rp</span>}
      endContent={<span className="text-sm text-default-400">,00</span>}
    />
  );
}
