import type { MetadataRoute } from "next";

/** Manifest PWA — rend l'app installable sur l'écran d'accueil. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "TCG — Kodawari",
    short_name: "TCG",
    description: "Collection Magic: The Gathering — Final Fantasy",
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0e1a47",
    theme_color: "#0e1a47",
    lang: "fr",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
