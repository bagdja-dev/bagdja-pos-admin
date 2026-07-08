'use client';

import { useState, type KeyboardEvent } from 'react';
import { Chip } from '@heroui/react';

interface TagInputProps {
  label?: string;
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
}

function capitalize(text: string): string {
  return text
    .toUpperCase()
    // .split(' ')
    // .map((word) => (word ? word.charAt(0).toUpperCase() + word.slice(1) : word))
    // .join(' ');
}

/** Input tag bebas (label pencarian, mis. nama kendaraan yang cocok untuk sparepart). Enter/koma untuk menambah. */
export function TagInput({ label, value, onChange, placeholder }: TagInputProps) {
  const [draft, setDraft] = useState('');

  function commitDraft() {
    const tag = capitalize(draft.trim());
    if (tag && !value.includes(tag)) {
      onChange([...value, tag]);
    }
    setDraft('');
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      commitDraft();
    } else if (e.key === 'Backspace' && !draft && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  }

  function removeTag(tag: string) {
    onChange(value.filter((t) => t !== tag));
  }

  return (
    <div className="space-y-2">
      {label && <label className="px-1 text-xs font-medium text-default-600">{label}</label>}
      <div className="flex min-h-[42px] flex-wrap items-center gap-1.5 rounded-xl border border-default-200 bg-default-50 px-3 py-2 focus-within:ring-2 focus-within:ring-primary/50">
        {value.map((tag) => (
          <Chip key={tag} size="sm" variant="flat" onClose={() => removeTag(tag)}>
            {tag}
          </Chip>
        ))}
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(capitalize(e.target.value))}
          onKeyDown={handleKeyDown}
          onBlur={commitDraft}
          placeholder={value.length === 0 ? placeholder ?? 'Ketik lalu Enter...' : ''}
          className="min-w-[100px] flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-default-400"
        />
      </div>
    </div>
  );
}
