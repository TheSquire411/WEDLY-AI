import type { NextConfig } from 'next';
require('dotenv').config({ path: './.env.local' });

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'placehold.co', port: '', pathname: '/**' },
      { protocol: 'https', hostname: 'api.qrserver.com', port: '', pathname: '/**' },
      { protocol: 'https', hostname: 'images.unsplash.com', port: '', pathname: '/**' },
      { protocol: 'https', hostname: 'i.imgur.com', port: '', pathname: '/**' },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(self), usb=(), magnetometer=(), accelerometer=(), gyroscope=(), fullscreen=(self), picture-in-picture=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
          { key: 'X-DNS-Prefetch-Control', value: 'off' },
          { key: 'X-Download-Options', value: 'noopen' },
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, proxy-revalidate' },
          { key: 'X-API-Version', value: '1.0' },
          { key: 'X-Rate-Limit-Policy', value: 'enabled' },
        ],
      },
      {
        source: '/api/webhooks/(.*)',
        headers: [
          { key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive, nosnippet' },
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0' },
          { key: 'Pragma', value: 'no-cache' },
          { key: 'Expires', value: '0' },
        ],
      },
      {
        source: '/api/create-checkout-session',
        headers: [
          { key: 'X-Content-Security-Policy', value: "default-src 'self'; script-src 'self' https://js.stripe.com; frame-src https://js.stripe.com https://hooks.stripe.com;" },
          { key: 'X-Payment-Security', value: 'enabled' },
        ],
      },
      {
        source: '/_next/static/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
        ],
      },
    ];
  },
  webpack(config, { isServer }) {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        http2: false,
        stream: false,
        events: false,
      };
    }
    return config;
  },
};

export default nextConfig;
