import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Kebijakan Privasi — Bagdja POS',
  description: 'Kebijakan privasi Bagdja POS: informasi yang kami kumpulkan, cara penggunaannya, dan hak Anda sebagai pengguna.',
};

const LAST_UPDATED = '21 Juli 2026';

export default function PrivacyPolicyPage() {
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
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Kebijakan Privasi</h1>
        <p className="mt-2 text-sm text-gray-500">Terakhir diperbarui: {LAST_UPDATED}</p>

        <div className="mt-10 space-y-10 text-[15px] leading-relaxed text-gray-600">
          <section>
            <p>
              Bagdja Platform (&quot;kami&quot;) mengoperasikan Bagdja POS, sebuah layanan manajemen bisnis
              berbasis cloud (&quot;Layanan&quot;). Kebijakan Privasi ini menjelaskan bagaimana kami mengumpulkan,
              menggunakan, menyimpan, dan melindungi informasi Anda saat menggunakan Layanan, baik melalui
              browser, aplikasi web, maupun aplikasi Android.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900">1. Informasi yang Kami Kumpulkan</h2>
            <div className="mt-4 space-y-4">
              <div>
                <h3 className="font-semibold text-gray-800">a. Data Akun</h3>
                <p className="mt-1">
                  Nama, alamat email, nomor telepon, dan kata sandi (disimpan dalam bentuk terenkripsi) saat
                  Anda mendaftar atau masuk ke akun Bagdja.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">b. Data Bisnis</h3>
                <p className="mt-1">
                  Data yang Anda masukkan untuk mengelola bisnis Anda, seperti faktur, stok barang/jasa, data
                  kontak pelanggan &amp; pemasok, transaksi kas, dan laporan keuangan. Data ini adalah milik
                  Anda dan pemilik bisnis terkait.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">c. Data Perangkat &amp; Penggunaan</h3>
                <p className="mt-1">
                  Informasi teknis seperti jenis perangkat, sistem operasi, alamat IP, log aktivitas aplikasi,
                  dan token notifikasi push (untuk mengirim pemberitahuan ke aplikasi Android/PWA Anda).
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900">2. Bagaimana Kami Menggunakan Informasi</h2>
            <ul className="mt-4 list-disc space-y-2 pl-5">
              <li>Menyediakan, mengoperasikan, dan memelihara Layanan.</li>
              <li>Memproses transaksi dan menampilkan laporan bisnis Anda.</li>
              <li>Mengirim notifikasi terkait aktivitas akun atau bisnis (mis. stok menipis, faktur jatuh tempo).</li>
              <li>Memberikan dukungan pelanggan dan menanggapi pertanyaan Anda.</li>
              <li>Meningkatkan keamanan, mencegah penyalahgunaan, dan menyempurnakan Layanan.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900">3. Berbagi Informasi dengan Pihak Ketiga</h2>
            <p className="mt-4">
              Kami tidak menjual data pribadi maupun data bisnis Anda kepada pihak ketiga. Informasi hanya
              dibagikan kepada penyedia infrastruktur yang membantu operasional Layanan (mis. penyedia hosting
              server dan layanan pengiriman notifikasi), dan hanya sebatas yang diperlukan untuk menjalankan
              fungsi tersebut. Kami dapat mengungkapkan informasi apabila diwajibkan oleh hukum yang berlaku.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900">4. Keamanan Data</h2>
            <p className="mt-4">
              Kami menerapkan langkah-langkah teknis dan organisasi yang wajar untuk melindungi data Anda,
              termasuk enkripsi kata sandi, koneksi terenkripsi (HTTPS), dan pembatasan akses berdasarkan peran
              pengguna dalam suatu bisnis. Meskipun demikian, tidak ada metode transmisi atau penyimpanan data
              elektronik yang 100% aman.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900">5. Penyimpanan Data</h2>
            <p className="mt-4">
              Data Anda disimpan selama akun dan bisnis Anda masih aktif di Layanan. Anda dapat meminta
              penghapusan akun dan data terkait kapan saja melalui kontak yang tercantum di bawah, kecuali data
              yang wajib kami simpan untuk kepatuhan hukum atau kepentingan bisnis yang sah (mis. catatan
              transaksi keuangan).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900">6. Hak Anda</h2>
            <p className="mt-4">Anda berhak untuk:</p>
            <ul className="mt-2 list-disc space-y-2 pl-5">
              <li>Mengakses dan memperbarui data akun Anda melalui pengaturan aplikasi.</li>
              <li>Meminta salinan data bisnis yang Anda simpan di Layanan.</li>
              <li>Meminta penghapusan akun beserta data terkait.</li>
              <li>Menarik persetujuan atas notifikasi yang bersifat opsional.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900">7. Cookie &amp; Teknologi Sejenis</h2>
            <p className="mt-4">
              Kami menggunakan cookie dan penyimpanan lokal browser (local storage) untuk menjaga sesi login
              Anda tetap aktif dan mengingat preferensi tampilan. Anda dapat menonaktifkan cookie melalui
              pengaturan browser, namun beberapa fitur Layanan mungkin tidak berfungsi optimal.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900">8. Privasi Anak</h2>
            <p className="mt-4">
              Layanan ini ditujukan untuk pelaku usaha dan tidak ditujukan untuk digunakan oleh anak-anak di
              bawah 13 tahun. Kami tidak dengan sengaja mengumpulkan data pribadi dari anak-anak.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900">9. Perubahan Kebijakan</h2>
            <p className="mt-4">
              Kami dapat memperbarui Kebijakan Privasi ini dari waktu ke waktu. Perubahan signifikan akan kami
              informasikan melalui aplikasi atau email terdaftar Anda. Tanggal &quot;Terakhir diperbarui&quot; di
              bagian atas halaman ini menunjukkan revisi terakhir.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900">10. Hubungi Kami</h2>
            <p className="mt-4">
              Jika Anda memiliki pertanyaan mengenai Kebijakan Privasi ini atau ingin mengajukan permintaan
              terkait data Anda, silakan hubungi kami melalui:
            </p>
            <ul className="mt-3 space-y-1">
              <li>
                Email:{' '}
                <a href="mailto:pos@bagdja.com" className="font-medium text-violet-600 hover:underline">
                  pos@bagdja.com
                </a>
              </li>
              <li>
                WhatsApp:{' '}
                <a
                  href="https://wa.me/6285488448383"
                  className="font-medium text-violet-600 hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  +62 854-8844-8383
                </a>
              </li>
            </ul>
          </section>
        </div>
      </main>
    </div>
  );
}
