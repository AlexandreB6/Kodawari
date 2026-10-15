/**
 * Génère les icônes PWA des 3 apps à partir d'un SVG décrit ici.
 *
 *   node scripts/generate-icons.mjs [film|manga|paint]
 *
 * Sort dans apps/<app>/public/ : icon-192, icon-512, icon-maskable-512
 * (glyphe rétréci pour la zone de sécurité Android) et apple-touch-icon.
 * Formes géométriques simples volontairement : lisibles à 48 px.
 */

import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const BG = "#0a0a0a";

/** Glyphe dessiné dans un viewBox 0 0 100 100, centré. */
const GLYPHS = {
  film: {
    color: "#60a5fa",
    // Pellicule : cadre + perforations + séparateurs
    body: `
      <rect x="14" y="20" width="72" height="60" rx="8" fill="none" stroke="C" stroke-width="6"/>
      <line x1="32" y1="20" x2="32" y2="80" stroke="C" stroke-width="6"/>
      <line x1="68" y1="20" x2="68" y2="80" stroke="C" stroke-width="6"/>
      <rect x="18" y="28" width="10" height="9" rx="2" fill="C"/>
      <rect x="18" y="45.5" width="10" height="9" rx="2" fill="C"/>
      <rect x="18" y="63" width="10" height="9" rx="2" fill="C"/>
      <rect x="72" y="28" width="10" height="9" rx="2" fill="C"/>
      <rect x="72" y="45.5" width="10" height="9" rx="2" fill="C"/>
      <rect x="72" y="63" width="10" height="9" rx="2" fill="C"/>`,
  },
  manga: {
    color: "#a78bfa",
    // Livre ouvert : deux pages + reliure
    body: `
      <path d="M50 30 C42 22 28 20 16 22 L16 76 C28 74 42 76 50 82 Z" fill="none" stroke="C" stroke-width="6" stroke-linejoin="round"/>
      <path d="M50 30 C58 22 72 20 84 22 L84 76 C72 74 58 76 50 82 Z" fill="none" stroke="C" stroke-width="6" stroke-linejoin="round"/>
      <line x1="50" y1="30" x2="50" y2="82" stroke="C" stroke-width="6"/>`,
  },
  paint: {
    color: "#fbbf24",
    // Palette : disque + trois godets
    body: `
      <circle cx="50" cy="50" r="32" fill="none" stroke="C" stroke-width="6"/>
      <circle cx="38" cy="38" r="6" fill="C"/>
      <circle cx="62" cy="42" r="6" fill="C"/>
      <circle cx="44" cy="62" r="6" fill="C"/>`,
  },
};

function svg(app, { padding }) {
  const { color, body } = GLYPHS[app];
  const scale = 1 - padding * 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" fill="${BG}"/>
  <g transform="translate(${padding * 100} ${padding * 100}) scale(${scale})" stroke-linecap="round">
    ${body.replaceAll('"C"', `"${color}"`)}
  </g>
</svg>`;
}

async function render(app) {
  const out = join(ROOT, "apps", app, "public");
  await mkdir(out, { recursive: true });

  const normal = Buffer.from(svg(app, { padding: 0.06 }));
  // Maskable : Android rogne jusqu'à 20 % de chaque bord.
  const maskable = Buffer.from(svg(app, { padding: 0.22 }));

  const jobs = [
    ["icon-192.png", normal, 192],
    ["icon-512.png", normal, 512],
    ["icon-maskable-512.png", maskable, 512],
    ["apple-touch-icon.png", normal, 180],
  ];

  for (const [name, source, size] of jobs) {
    await sharp(source, { density: 512 }).resize(size, size).png().toFile(join(out, name));
    console.log(`  ${app}/public/${name}`);
  }
}

const apps = process.argv[2] ? [process.argv[2]] : Object.keys(GLYPHS);
for (const app of apps) {
  console.log(`${app} :`);
  await render(app);
}
