/** @type {import('next').NextConfig} */
// Force SSR (no static export) so API routes work in production
const nextConfig = {
  reactStrictMode: true,
  experimental: { optimizePackageImports: ['jspdf', 'jspdf-autotable'] },
};
export default nextConfig;
