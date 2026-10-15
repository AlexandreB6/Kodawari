/**
 * Interfaces communes pour les gammes de peinture.
 * Pure computation, importable côté client.
 */

/** Structure générique d'une peinture */
export interface Paint {
  id: string;
  name: string;
  hex: string;
  type: string;
  metallic?: boolean;
}

/** Définition d'une gamme de peinture */
export interface PaintRange {
  slug: string;
  brand: string;
  name: string;
  description: string;
  paints: Paint[];
  paintTypes: string[];
  typeColors: Record<string, string>;
}

/** Familles de couleur dérivées depuis le code hex */
export type ColorFamily =
  | "Rouge"
  | "Orange"
  | "Jaune"
  | "Vert"
  | "Bleu"
  | "Violet"
  | "Rose"
  | "Marron"
  | "Gris"
  | "Noir"
  | "Blanc"
  | "Beige";

/**
 * Dérive la famille de couleur depuis un code hex.
 * Utilise la teinte HSL et des heuristiques pour les cas limites.
 */
export function getColorFamily(hex: string): ColorFamily {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  const lightness = (max + min) / 2 / 255;
  const saturation = delta === 0 ? 0 : delta / (1 - Math.abs(2 * lightness - 1)) / 255;

  if (max <= 30) return "Noir";
  if (min >= 230) return "Blanc";
  if (saturation < 0.15 && lightness > 0.12 && lightness < 0.9) return "Gris";
  if (saturation < 0.15 && lightness >= 0.9) return "Blanc";

  let hue = 0;
  if (delta > 0) {
    if (max === r) hue = 60 * (((g - b) / delta) % 6);
    else if (max === g) hue = 60 * ((b - r) / delta + 2);
    else hue = 60 * ((r - g) / delta + 4);
    if (hue < 0) hue += 360;
  }

  if (hue >= 0 && hue < 45 && lightness < 0.45 && saturation < 0.8) return "Marron";
  if (hue >= 30 && hue < 55 && lightness > 0.55 && saturation < 0.6) return "Beige";

  if (hue < 15 || hue >= 345) return "Rouge";
  if (hue < 40) return "Orange";
  if (hue < 65) return "Jaune";
  if (hue < 170) return "Vert";
  if (hue < 260) return "Bleu";
  if (hue < 300) return "Violet";
  return "Rose";
}

/** Liste ordonnée des familles de couleur (pour les filtres UI) */
export const COLOR_FAMILIES: ColorFamily[] = [
  "Rouge",
  "Orange",
  "Jaune",
  "Vert",
  "Bleu",
  "Violet",
  "Rose",
  "Marron",
  "Beige",
  "Gris",
  "Noir",
  "Blanc",
];
