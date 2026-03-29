import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  experimental: { serverActions: { allowedOrigins: ["localhost:3000", "hiresignal.vercel.app"] } },
}

export default nextConfig
