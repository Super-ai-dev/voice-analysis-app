/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  eslint: {
    // ESLintチェックを無効化
    ignoreDuringBuilds: true,
  },
  typescript: {
    // 型チェックを無効化
    ignoreBuildErrors: true,
  },
  output: 'standalone',
  distDir: 'build',
  // Vercelのビルドプロセスをカスタマイズ
  experimental: {
    forceSwcTransforms: true,
  },
};

module.exports = nextConfig;
