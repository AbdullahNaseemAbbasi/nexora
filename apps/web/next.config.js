/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  transpilePackages: ["@nexora/shared"],
};

module.exports = nextConfig;
