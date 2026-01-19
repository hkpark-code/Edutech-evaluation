import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Windows 11 compatibility
  reactStrictMode: true,
  
  // Performance optimizations
  swcMinify: true,
  
  // TypeScript and ESLint
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  
  // Output configuration
  output: 'standalone',
  
  // Experimental features for better performance
  experimental: {
    optimizePackageImports: ['react', 'react-dom'],
  },
};

export default nextConfig;







