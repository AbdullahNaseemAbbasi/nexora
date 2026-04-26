/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  transpilePackages: ["@nexora/shared"],
  reactStrictMode: false,
};

module.exports = nextConfig;
