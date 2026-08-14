import Image from 'next/image';

export function LandingFooter() {
  return (
    <footer className="border-t border-gray-200 bg-gray-50">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-10 sm:px-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <Image src="/logo-black.png" alt="Bagdja" width={92} height={28} />
          <p className="text-sm text-gray-600">
            Sistem kasir digital untuk bisnis yang berkembang
          </p>
        </div>
        <div className="flex flex-col gap-1 text-sm text-gray-600 md:text-right">
          <a 
            className="transition-colors hover:text-gray-900" 
            href="mailto:pos@bagdja.com"
          >
            pos@bagdja.com
          </a>
          <a
            className="transition-colors hover:text-gray-900"
            href="https://wa.me/6285488448383"
            target="_blank"
            rel="noreferrer"
          >
            WhatsApp +62 854-8844-8383
          </a>
          <span className="text-xs text-gray-400">
            © {new Date().getFullYear()} Bagdja. Semua hak dilindungi.
          </span>
          <span className="text-xs text-gray-400">
            KP Bunisari RT 004 RW 004, Desa Limbangan Tengah, Kec. BL Limbangan, Kab. Garut, Jawa Barat 44168
          </span>
        </div>
      </div>
    </footer>
  );
}
