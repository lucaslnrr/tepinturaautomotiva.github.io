/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: { optimizePackageImports: ['jspdf', 'jspdf-autotable'] }
};
export default nextConfig;
