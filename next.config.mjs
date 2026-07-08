/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Mematikan pengecekan ESLint saat build
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Mematikan pengecekan TypeScript saat build
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
