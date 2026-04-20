/** @type {import('next').NextConfig} */
const basePath = process.env.BASE_PATH || '';

const nextConfig = {
  basePath: basePath || undefined,
  assetPrefix: basePath || undefined,
  serverExternalPackages: ['better-sqlite3', 'node-pty'],
  webpack: (config) => {
    config.externals = config.externals || [];
    config.externals.push({ 'better-sqlite3': 'commonjs better-sqlite3', 'node-pty': 'commonjs node-pty' });
    return config;
  },
};

export default nextConfig;
