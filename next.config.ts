import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Windows 11 compatibility
  reactStrictMode: true,

  // TypeScript and ESLint
  typescript: {
    ignoreBuildErrors: false,
  },

  // GitHub Pages configuration
  output: 'export',
  basePath: '/Edutech-evaluation',
  images: {
    unoptimized: true,
  },

  // Experimental features for better performance
  experimental: {
    optimizePackageImports: ['react', 'react-dom'],
  },
};

export default nextConfig;







