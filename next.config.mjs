/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: { optimizePackageImports: ['jspdf', 'jspdf-autotable'] },
  // Enable static export so it works on GitHub Pages/any static host
  output: 'export',
  images: { unoptimized: true },
  trailingSlash: true,
};
export default nextConfig;
