import path from 'path';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    typedRoutes: true
  },
  webpack: (config) => {
    config.resolve.alias['@'] = path.resolve(process.cwd(), 'src');
    return config;
  }
};

export default nextConfig;
