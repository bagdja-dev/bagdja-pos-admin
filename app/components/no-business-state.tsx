import Link from 'next/link';
import { Button } from '@heroui/react';

export function NoBusinessState() {
  return (
    <div className="flex h-96 flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-default-300 text-center">
      <p className="text-lg font-semibold text-foreground">Belum ada bisnis</p>
      <p className="max-w-sm text-sm text-default-500">
        Anda belum jadi staff di bisnis manapun. Buat bisnis baru untuk mulai mengelola bengkel/toko Anda.
      </p>
      <Button as={Link} href="/dashboard/businesses/new" color="primary">
        Buat Bisnis Baru
      </Button>
    </div>
  );
}
