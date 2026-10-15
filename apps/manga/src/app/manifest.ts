import type { MetadataRoute } from "next";

/** Manifest PWA — rend l'app installable sur l'écran d'accueil. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Manga — Kodawari",
    short_name: "Manga",
    description: "Ma collection de mangas et le suivi des volumes possédés",
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0a0a0a",
    theme_color: "#0a0a0a",
    lang: "fr",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
