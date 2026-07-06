/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // No rewrites needed — lib/api.ts calls FastAPI directly via NEXT_PUBLIC_API_URL
};
module.exports = nextConfig;
