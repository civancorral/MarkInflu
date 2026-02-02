/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@markinflu/database', '@markinflu/types'],
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  images: {
    remotePatterns: [
      // S3/MinIO/R2 storage
      { protocol: 'https', hostname: '**.amazonaws.com' },
      { protocol: 'https', hostname: '**.r2.cloudflarestorage.com' },
      { protocol: 'http', hostname: 'localhost', port: '9000' },
      // Social platforms
      { protocol: 'https', hostname: '**.cdninstagram.com' },
      { protocol: 'https', hostname: '**.googleusercontent.com' },
      { protocol: 'https', hostname: '**.ggpht.com' },
      { protocol: 'https', hostname: '**.ytimg.com' },
      { protocol: 'https', hostname: '**.fbcdn.net' },
      { protocol: 'https', hostname: '**.twimg.com' },
      { protocol: 'https', hostname: '**.tiktokcdn.com' },
      // CDN (configurable)
      ...(process.env.CDN_URL
        ? [{ protocol: 'https', hostname: new URL(process.env.CDN_URL).hostname }]
        : []),
    ],
  },
}

module.exports = nextConfig
