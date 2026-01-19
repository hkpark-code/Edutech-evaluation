/** @type {import('next').NextConfig} */
const nextConfig = {
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

module.exports = nextConfig;
