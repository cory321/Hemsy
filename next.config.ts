import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // App Router is enabled by default in Next.js 15+

  // Turbopack configuration (now stable)
  turbopack: {
    resolveAlias: {
      // Add any custom aliases if needed
    },
  },

  experimental: {
    // Enable Server Actions (stable in Next.js 15+)
    serverActions: {
      allowedOrigins: ['localhost:3000'],
    },
  },

  // Compiler configuration for emotion (Material UI's CSS-in-JS)
  compiler: {
    emotion: true,
  },

  // PWA and performance optimizations
  images: {
    formats: ['image/webp', 'image/avif'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        port: '',
        pathname: '/**',
      },
    ],
  },

  // TypeScript configuration
  typescript: {
    // Enable type checking during build
    ignoreBuildErrors: false,
  },

  // ESLint configuration
  eslint: {
    // Don't ignore errors during builds
    ignoreDuringBuilds: false,
  },

  // Bundle analyzer (development only)
  webpack: (config, { dev, isServer }) => {
    // Optimize bundle size
    if (!dev && !isServer) {
      config.optimization.splitChunks.cacheGroups = {
        ...config.optimization.splitChunks.cacheGroups,
        mui: {
          name: 'mui',
          test: /[\\/]node_modules[\\/]@mui[\\/]/,
          chunks: 'all',
          priority: 10,
        },
      };
    }
    return config;
  },

  // Headers for security and performance
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
