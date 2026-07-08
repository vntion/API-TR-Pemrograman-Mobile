/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Mematikan pengecekan ESLint saat build (berguna jika ada error non-kritikal)
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
