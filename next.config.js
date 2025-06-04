/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['lichess.org', 'images.chesscomfiles.com'],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Add external dependencies for server-side WebSocket support
      config.externals = config.externals || [];
      config.externals.push('ws');
    }
    return config;
  },
  experimental: {
    // Enable server components for better performance
    serverComponentsExternalPackages: ['ws'],
  },
  // Enable WebSocket support in API routes
  env: {
    CHESS_API_URL: 'wss://chess-api.com/v1',
  },
};

module.exports = nextConfig;