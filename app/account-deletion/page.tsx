import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Penghapusan Akun & Data — Bagdja POS',
  description: 'Cara mengajukan penghapusan akun Bagdja POS beserta data terkait, dan penjelasan data apa saja yang dihapus.',
};

const LAST_UPDATED = '23 Juli 2026';

export default function AccountDeletionPage() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-100 px-4 py-5">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <Link href="/" className="flex items-center">
            <img src="/logo-full.png" alt="Bagdja POS" className="h-7 w-auto" />
          </Link>
          <Link href="/" className="text-sm font-medium text-gray-500 transition-colors hover:text-gray-900">
            &larr; Kembali ke Beranda
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Penghapusan Akun & Data</h1>
        <p className="mt-2 text-sm text-gray-500">Terakhir diperbarui: {LAST_UPDATED}</p>

        <div className="mt-10 space-y-10 text-[15px] leading-relaxed text-gray-600">
          <section>
            <p>
              Anda dapat mengajukan permintaan untuk menghapus akun Bagdja POS Anda beserta data pribadi yang
              terkait. Halaman ini menjelaskan cara mengajukan permintaan tersebut, data apa saja yang akan
              dihapus, dan data apa yang mungkin tetap kami simpan beserta alasannya.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900">1. Cara Mengajukan Penghapusan</h2>
            <p className="mt-4">
              Kirim permintaan penghapusan akun melalui salah satu kontak berikut, menggunakan email/nomor yang
              terdaftar pada akun Anda supaya identitas dapat kami verifikasi:
            </p>
            <ul className="mt-3 space-y-1">
              <li>
                Email ke{' '}
                <a
                  href="mailto:pos@bagdja.com?subject=Permintaan%20Hapus%20Akun%20Bagdja%20POS"
                  className="font-medium text-violet-600 hover:underline"
                >
                  pos@bagdja.com
                </a>{' '}
                dengan subjek &quot;Permintaan Hapus Akun&quot;
              </li>
              <li>
                WhatsApp ke{' '}
                <a
                  href="https://wa.me/6285488448383?text=Saya%20ingin%20mengajukan%20penghapusan%20akun%20Bagdja%20POS"
                  className="font-medium text-violet-600 hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  +62 854-8844-8383
                </a>
              </li>
            </ul>
            <p className="mt-3">
              Sertakan email/username akun dan nama bisnis (jika Anda pemilik/staf suatu bisnis) pada permintaan
              Anda. Kami akan memproses permintaan paling lambat 30 hari kerja setelah identitas terverifikasi.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900">2. Data yang Dihapus</h2>
            <p className="mt-4">Setelah permintaan disetujui, kami menghapus:</p>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li>Profil akun — nama, email, nomor telepon, dan kata sandi.</li>
              <li>Sesi login dan token notifikasi push yang terhubung ke akun Anda.</li>
              <li>Keanggotaan Anda pada bisnis-bisnis yang terdaftar di akun tersebut.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900">3. Data yang Mungkin Tetap Disimpan</h2>
            <p className="mt-4">
              Bagdja POS adalah aplikasi multi-pengguna per bisnis — data transaksi (faktur, stok, kas, piutang/
              hutang) dimiliki bersama oleh bisnis tempat Anda terdaftar, bukan cuma akun pribadi Anda. Karena itu:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li>
                Jika Anda staf pada suatu bisnis, akun Anda dihapus tetapi catatan transaksi yang sudah Anda buat
                di bisnis tersebut tetap tersimpan sebagai bagian dari data bisnis (mis. untuk pembukuan/pajak
                pemilik bisnis), dengan identitas Anda dianonimkan bila memungkinkan.
              </li>
              <li>
                Jika Anda pemilik satu-satunya suatu bisnis dan ingin menghapus seluruh data bisnis tersebut juga,
                sebutkan hal ini secara eksplisit pada permintaan Anda.
              </li>
              <li>
                Catatan keuangan tertentu dapat tetap kami simpan sesuai kewajiban hukum/perpajakan yang berlaku,
                meski akun login Anda sudah dihapus.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900">4. Pertanyaan</h2>
            <p className="mt-4">
              Untuk pertanyaan lebih lanjut seputar penghapusan akun atau data, hubungi kami melalui{' '}
              <a href="mailto:pos@bagdja.com" className="font-medium text-violet-600 hover:underline">
                pos@bagdja.com
              </a>
              . Lihat juga{' '}
              <Link href="/privacy-policy" className="font-medium text-violet-600 hover:underline">
                Kebijakan Privasi
              </Link>{' '}
              kami untuk penjelasan lebih lengkap tentang data yang kami kumpulkan.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
