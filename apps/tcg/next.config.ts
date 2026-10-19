import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Les packages du monorepo sont livrés en TS brut : Next doit les compiler.
  transpilePackages: ["@repo/auth", "@repo/core", "@repo/ui"],
};

export default nextConfig;
