import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@techscholars/types', '@techscholars/config'],
};

export default nextConfig;