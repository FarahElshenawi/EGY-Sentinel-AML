/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow react-force-graph-2d to load (it uses browser APIs)
  reactStrictMode: true,
  // Proxy API calls to FastAPI during dev (avoids CORS issues in some setups)
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
