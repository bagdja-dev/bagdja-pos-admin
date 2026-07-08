'use client';

import { Input } from '@heroui/react';

interface NumberInputProps {
  label?: string;
  value: string | number;
  onValueChange: (raw: string) => void;
  placeholder?: string;
  isRequired?: boolean;
  isDisabled?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

function toDigits(value: string | number): string {
  const num = typeof value === 'number' ? value : parseFloat(value || '0');
  if (!Number.isFinite(num) || num === 0) return '';
  return String(Math.round(num));
}

function groupThousands(digits: string): string {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/** Input bilangan bulat bermasking ribuan (`#.###`) — mis. qty, stok minimum. Auto-select saat fokus supaya cepat ditimpa. */
export function NumberInput({ label, value, onValueChange, placeholder, isRequired, isDisabled, className, size = 'md' }: NumberInputProps) {
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
      isDisabled={isDisabled}
      className={className}
      size={size}
      inputMode="numeric"
      classNames={{ input: 'text-right font-mono' }}
    />
  );
}
