/** @type {import('next').NextConfig} */
const isExport = process.env.NEXT_OUTPUT_EXPORT === 'true';
const nextConfig = {
  reactStrictMode: true,
  experimental: { optimizePackageImports: ['jspdf', 'jspdf-autotable'] },
  ...(isExport ? { output: 'export', images: { unoptimized: true }, trailingSlash: true } : {}),
};
export default nextConfig;
