import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  serverExternalPackages: ['html5-qrcode', 'qrcode', 'bcrypt'],
  turbopack: {},
}

export default nextConfig
