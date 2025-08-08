import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Fix for Next.js 15 - use serverExternalPackages instead of experimental.serverComponentsExternalPackages
  serverExternalPackages: [
    'firebase-admin',
    '@opentelemetry/winston-transport',
    '@opentelemetry/instrumentation-winston',
    'genkit',
    '@genkit-ai/core',
    '@genkit-ai/googleai',
    '@genkit-ai/firebase',
    '@genkit-ai/google-cloud',
  ],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'placehold.co', port: '', pathname: '/**' },
      { protocol: 'https', hostname: 'api.qrserver.com', port: '', pathname: '/**' },
      { protocol: 'https', hostname: 'images.unsplash.com', port: '', pathname: '/**' },
      { protocol: 'https', hostname: 'i.imgur.com', port: '', pathname: '/**' },
      // Add Firebase Storage domains
      { protocol: 'https', hostname: '*.firebasestorage.app', port: '', pathname: '/**' },
      { protocol: 'https', hostname: '*.googleapis.com', port: '', pathname: '/**' },
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
      // More comprehensive webpack fallbacks for client-side
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        http2: false,
        stream: false,
        events: false,
        crypto: false,
        os: false,
        path: false,
        util: false,
        buffer: false,
        assert: false,
        url: false,
        querystring: false,
        // OpenTelemetry and Firebase Admin fallbacks
        'node:fs': false,
        'node:http2': false,
        'node:stream': false,
        'node:events': false,
        'node:crypto': false,
        'node:os': false,
        'node:path': false,
        'node:util': false,
        'node:buffer': false,
        'node:assert': false,
        'node:url': false,
        'node:querystring': false,
      };
      
      // Ignore Node.js-specific modules on the client side
      config.externals = config.externals || [];
      config.externals.push({
        'firebase-admin': 'commonjs firebase-admin',
        '@opentelemetry/winston-transport': 'commonjs @opentelemetry/winston-transport',
        '@opentelemetry/instrumentation-winston': 'commonjs @opentelemetry/instrumentation-winston',
      });
    }
    
    // Handle handlebars compilation issues
    config.module.rules.push({
      test: /\.js$/,
      include: /node_modules\/handlebars/,
      use: {
        loader: 'babel-loader',
        options: {
          presets: ['@babel/preset-env'],
        },
      },
    });

    return config;
  },
};

export default nextConfig;