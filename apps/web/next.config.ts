import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  experimental: { serverActions: { allowedOrigins: ["localhost:3000", "specters.vercel.app", "hiresignal.vercel.app", "specters.works", "www.specters.works"] } },
}

export default nextConfig
