/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@heroui/react'],
  experimental: {
    optimizePackageImports: ['@heroui/react'],
  },
  // Output minimal self-contained server (cuma node_modules yang benar-benar
  // dipakai, hasil dependency tracing) — dipakai Dockerfile untuk image yang
  // jauh lebih kecil daripada copy node_modules penuh. Tidak ada precedent
  // Next.js Docker lain di ekosistem Bagdja untuk dicontoh, ini pola baru.
  output: 'standalone',
};

module.exports = nextConfig;
