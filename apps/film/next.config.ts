import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Les packages du monorepo sont livrés en TS brut : Next doit les compiler.
  transpilePackages: ["@repo/core", "@repo/ui"],
  // Autorise les images distantes depuis TMDB (posters, backdrops, photos)
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "image.tmdb.org",
        pathname: "/t/p/**",
      },
    ],
  },
};

export default nextConfig;
