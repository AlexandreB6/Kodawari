/**
 * Catalogue des peintures Pro Acryl (Monument Hobbies).
 * Hex approximés d'après les noms de couleur.
 */

import type { Paint, PaintRange } from "./paint-types";

function slug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function p(name: string, hex: string, type: string, metallic?: boolean): Paint {
  return { id: slug(name), name, hex, type, ...(metallic && { metallic }) };
}

export const MONUMENT_HOBBIES_PAINTS: Paint[] = [
  // ── Core Pro Acryl — Bold ─────────────────────────────
  p("Bold Titanium White", "#FFFFFF", "Bold"),                 // 001

  // ── Core Pro Acryl — Standard (002–075) ────────────────
  p("Coal Black", "#1A1A1A", "Standard"),                      // 002
  p("Green", "#228B22", "Standard"),                           // 004
  p("Blue", "#2563EB", "Standard"),                            // 005
  p("Golden Yellow", "#FFC107", "Standard"),                   // 006
  p("Orange", "#FF8C00", "Standard"),                          // 007
  p("Burnt Red", "#8B2500", "Standard"),                       // 008
  p("Mahogany", "#6B3226", "Standard"),                        // 009
  p("Purple", "#6A0DAD", "Standard"),                          // 010
  p("Magenta", "#CC0066", "Standard"),                         // 011
  p("Sky Blue", "#87CEEB", "Standard"),                        // 012
  p("Faded Ultramarine", "#6673AB", "Standard"),               // 013
  p("Dark Grey Blue", "#3B4D5E", "Standard"),                  // 014
  p("Bright Warm Grey", "#A69E90", "Standard"),                // 015
  p("Dark Warm Grey", "#504840", "Standard"),                  // 016
  p("Golden Brown", "#996515", "Standard"),                    // 017
  p("Light Umber", "#937A62", "Standard"),                     // 018
  p("Dark Umber", "#2C1608", "Standard"),                      // 019
  p("Camo Green", "#5C6B3C", "Standard"),                      // 020
  p("Jade", "#00A86B", "Standard"),                            // 021
  p("Bright Ivory", "#FFFFF0", "Standard"),                    // 022
  p("Ivory", "#EEEED2", "Standard"),                           // 023
  p("Tan Flesh", "#D2A87A", "Standard"),                       // 024
  p("Dark Blue", "#001F5C", "Standard"),                       // 034
  p("Dark Purple", "#3C0A6E", "Standard"),                     // 035
  p("Dark Camo Green", "#3B4A28", "Standard"),                 // 036
  p("Burnt Orange", "#CC5500", "Standard"),                    // 037
  p("Yellow Ochre", "#CC8800", "Standard"),                    // 038
  p("Bright Yellow Green", "#B5CC18", "Standard"),             // 039
  p("Black Brown", "#2A1F14", "Standard"),                     // 040
  p("Olive Flesh", "#C4A87A", "Standard"),                     // 041
  p("Shadow Flesh", "#8C5E3C", "Standard"),                    // 042
  p("Pale Pink", "#F5C4C4", "Standard"),                       // 043
  p("Dark Neutral Grey", "#484848", "Standard"),               // 044
  p("Bright Neutral Grey", "#A0A0A0", "Standard"),             // 045
  p("Turquoise", "#30D5C8", "Standard"),                       // 054
  p("Grey Blue", "#6B8BA4", "Standard"),                       // 055
  p("Blue Black", "#1A1A2E", "Standard"),                      // 056
  p("Black Green", "#1A2E1A", "Standard"),                     // 057
  p("Bright Pale Green", "#A8E6A0", "Standard"),               // 058
  p("Burnt Sienna", "#A0522D", "Standard"),                    // 059
  p("Pale Yellow", "#FAFAA0", "Standard"),                     // 060
  p("Khaki", "#C3B091", "Standard"),                           // 061
  p("Dark Golden Brown", "#6B4210", "Standard"),               // 062
  p("Faded Plum", "#8E6B8A", "Standard"),                      // 063
  p("Yellow Green", "#9ACD32", "Standard"),                    // 065
  p("Faded Green", "#7DA07D", "Standard"),                     // 066
  p("Bright Jade", "#00D68F", "Standard"),                     // 067
  p("Dark Flesh", "#7A4A2E", "Standard"),                      // 068
  p("Burgundy", "#6D0020", "Standard"),                        // 069
  p("Plum", "#6E2068", "Standard"),                            // 070
  p("Pink", "#FF69B4", "Standard"),                            // 071
  p("Warm Yellow", "#FFD54F", "Standard"),                     // 072
  p("Warm Flesh", "#E0A87A", "Standard"),                      // 073
  p("Warm Grey", "#8A827A", "Standard"),                       // 074
  p("Neutral Grey", "#808080", "Standard"),                    // 075

  // ── Core Pro Acryl — Bold ─────────────────────────────
  p("Bold Pyrrole Red", "#E62020", "Bold"),                    // 003

  // ── Core Pro Acryl — Metallic ─────────────────────────
  p("Silver", "#C0C0C0", "Metallic", true),                   // 025
  p("Light Bronze", "#C9A86C", "Metallic", true),              // 026
  p("Copper", "#B87333", "Metallic", true),                    // 027
  p("Rich Gold", "#CFB53B", "Metallic", true),                 // 028
  p("White Gold", "#E8E0C8", "Metallic", true),                // 029
  p("Dark Silver", "#707070", "Metallic", true),               // 030
  p("Bright Gold", "#FFD700", "Metallic", true),               // 031
  p("Bronze", "#CD7F32", "Metallic", true),                    // 032

  // ── Core Pro Acryl — Medium ───────────────────────────
  p("Metallic Medium", "#E8E8E8", "Medium"),                   // 033

  // ── Core Pro Acryl — Transparent ──────────────────────
  p("Transparent Blue", "#0044CC", "Transparent"),             // 046
  p("Transparent Red", "#CC0000", "Transparent"),              // 047
  p("Transparent Green", "#008800", "Transparent"),            // 048
  p("Transparent Yellow", "#FFD700", "Transparent"),           // 049
  p("Transparent Orange", "#FF6600", "Transparent"),           // 050
  p("Transparent Purple", "#6A0DAD", "Transparent"),           // 051
  p("Transparent Brown", "#6B3A1F", "Transparent"),            // 052
  p("Transparent Black", "#1A1A1A", "Transparent"),            // 053
  p("Transparent White", "#F5F5F5", "Transparent"),            // 064

  // ── Washes ────────────────────────────────────────────
  p("Black Wash", "#1A1008", "Wash"),                          // 200
  p("Brown Wash", "#4A3728", "Wash"),                          // 201
  p("Flesh Wash", "#8B6B4A", "Wash"),                          // 202

  // ── Signature Series ──────────────────────────────────
  // Vince Venturella (S01–S06)
  p("Vince Venturella Dark Jade", "#1A6B4A", "Signature"),
  p("Vince Venturella Payne's Grey", "#536878", "Signature"),
  p("Vince Venturella Royal Purple", "#7851A9", "Signature"),
  p("Vince Venturella White Blue", "#D6E4F0", "Signature"),
  p("Vince Venturella Beige Red", "#B07060", "Signature"),
  p("Vince Venturella Dark Yellow Green", "#5A6B20", "Signature"),
  // Ninjon (S07–S12)
  p("Ninjon Dark Ivory", "#BEB8A0", "Signature"),
  p("Ninjon Dark Warm Flesh", "#8B5E3C", "Signature"),
  p("Ninjon Warm Brown", "#7A5230", "Signature"),
  p("Ninjon Dark Magenta", "#8B0060", "Signature"),
  p("Ninjon Dark Plum", "#4A1042", "Signature"),
  p("Ninjon Red Grey", "#7A6060", "Signature"),
  // Ben Komets (S13–S18)
  p("Ben Komets Dark Sea Blue", "#1A4060", "Signature"),
  p("Ben Komets Petroleum Brown", "#4A3A28", "Signature"),
  p("Ben Komets Dark Burgundy", "#4A0018", "Signature"),
  p("Ben Komets Green Oxide", "#4A6B3A", "Signature"),
  p("Ben Komets Advanced Flesh Tone", "#C89878", "Signature"),
  p("Ben Komets Heavy Warm White", "#F5ECD8", "Signature"),
  // Matt Cexwish (S19–S24)
  p("Matt Cexwish Dark Crimson", "#7B0020", "Signature"),
  p("Matt Cexwish Dark Emerald", "#004D30", "Signature"),
  p("Matt Cexwish Heavy Titanium White", "#FAFAFA", "Signature"),
  p("Matt Cexwish Brown Grey", "#6B5E54", "Signature"),
  p("Matt Cexwish Bone", "#E3D5B8", "Signature"),
  p("Matt Cexwish Dark Bronze", "#5A4A30", "Signature", true),
  // Flameon (S25–S30)
  p("Flameon Dark Green Brown", "#3A3A1A", "Signature"),
  p("Flameon Dark Orange Brown", "#6B3A1A", "Signature"),
  p("Flameon Orange Brown", "#9A5A28", "Signature"),
  p("Flameon Caramel Brown", "#A06830", "Signature"),
  p("Flameon Bright Yellow Ochre", "#D4A820", "Signature"),
  p("Flameon Bright Pale Yellow", "#F5E88A", "Signature"),
  // Rogue Hobbies (S31–S36)
  p("Rogue Hobbies Orange Red", "#E04020", "Signature"),
  p("Rogue Hobbies Dark Hot Pink", "#C0206A", "Signature"),
  p("Rogue Hobbies Bright Green", "#00CC44", "Signature"),
  p("Rogue Hobbies Dark Turquoise", "#006B60", "Signature"),
  p("Rogue Hobbies Ultramarine", "#1E3F8B", "Signature"),
  p("Rogue Hobbies Bismuth Yellow", "#E8D020", "Signature"),
  // Adepticon (S37–S42)
  p("Adepticon Red Oxide", "#6D2B15", "Signature"),
  p("Adepticon Orange Oxide", "#A85A28", "Signature"),
  p("Adepticon Satin Black", "#0A0A0A", "Signature"),
  p("Adepticon Drab Brown", "#5A4A30", "Signature"),
  p("Adepticon Bright Shadow Flesh", "#B89070", "Signature"),
  p("Adepticon Magnesium", "#B8B8B0", "Signature", true),
  // NOVA (S49)
  p("NOVA Orange", "#FF6A00", "Signature"),

  // ── Fluorescent ───────────────────────────────────────
  p("Fluorescent Red", "#FF1A1A", "Fluorescent"),
  p("Fluorescent Orange", "#FF5F1F", "Fluorescent"),
  p("Fluorescent Yellow", "#DFFF00", "Fluorescent"),
  p("Fluorescent Green", "#39FF14", "Fluorescent"),
  p("Fluorescent Purple", "#BF00FF", "Fluorescent"),
  p("Fluorescent Pink", "#FF1493", "Fluorescent"),

  // ── AMP Colors ────────────────────────────────────────
  p("Cool Grey", "#7A8B8B", "AMP"),                           // AMP 002
  p("Black Red", "#3A0A0A", "AMP"),                            // AMP 004
  p("Dark Navy Blue", "#0A1A3A", "AMP"),                       // AMP 005
  p("Beige Grey", "#B0A898", "AMP"),                           // AMP 006
  p("Orange Yellow", "#F0A820", "AMP"),                        // AMP 007
  p("Peach Flesh", "#F5C0A0", "AMP"),                          // AMP 008
  p("Bright Green Blue", "#00A0A0", "AMP"),                    // AMP 009
  p("Steel", "#6A6A72", "AMP", true),                          // AMP 010
  p("Slate Grey", "#6A7080", "AMP"),                           // AMP 013
  p("Red Orange", "#E04020", "AMP"),                           // AMP 017
  p("Burnt Umber", "#3B2314", "AMP"),                          // AMP 018
  p("Green Brown", "#4A4A1A", "AMP"),                          // AMP 020
  p("Bright Brown Grey", "#9A8A78", "AMP"),                    // AMP 021
  p("Grey Green", "#5F7A61", "AMP"),                           // AMP 022

  // ── AMP Washes ────────────────────────────────────────
  p("Magenta Wash", "#6B1040", "Wash"),                        // AMP 011
  p("Petroleum Brown Wash", "#3A2A18", "Wash"),                // AMP 012
  p("Brown Grey Wash", "#4A4038", "Wash"),                     // AMP 023
  p("Payne's Grey Wash", "#3A4858", "Wash"),                   // AMP 024

  // ── Expert Acrylics ───────────────────────────────────
  p("Expert Titanium White", "#F5F5F0", "Expert"),             // Expert 001
  p("Expert Carbon Black", "#0A0A0A", "Expert"),               // Expert 002
  p("Expert Pyrrole Red", "#E62020", "Expert"),                // Expert 003
  p("Expert Permanent Green Light", "#3CB371", "Expert"),      // Expert 004
  p("Expert Prussian Blue", "#003153", "Expert"),              // Expert 005
  p("Expert Pyrrole Orange", "#E86020", "Expert"),             // Expert 006
  p("Expert Burnt Umber", "#3B2314", "Expert"),                // Expert 007
  p("Expert Dioxazine Violet", "#4B0076", "Expert"),           // Expert 008
  p("Expert Sap Green", "#507D2A", "Expert"),                  // Expert 009
  p("Expert Burnt Sienna", "#A0522D", "Expert"),               // Expert 010
  p("Expert Nickel Azo Yellow", "#D4A020", "Expert"),          // Expert 011
  p("Expert Sepia", "#704214", "Expert"),                      // Expert 012
  p("Expert Payne's Grey", "#536878", "Expert"),               // Expert 013
  p("Expert Primary Cyan", "#00B7EB", "Expert"),               // Expert 014
  p("Expert Primary Magenta", "#CC0066", "Expert"),            // Expert 015
  p("Expert Primary Yellow", "#FFE000", "Expert"),             // Expert 016

  // ── Primers ───────────────────────────────────────────
  p("Black Primer", "#1A1A1A", "Primer"),                      // PRIME 002
  p("White Primer", "#F0F0F0", "Primer"),                      // PRIME 003
  p("Dark Neutral Grey Primer", "#484848", "Primer"),          // PRIME 005
  p("Dark Camo Green Primer", "#3B4A28", "Primer"),            // PRIME 007
  p("Black Brown Primer", "#2A1F14", "Primer"),                // PRIME 011
  p("Brush-On White Primer", "#F5F5F5", "Primer"),             // PRIME 013
  p("Brush-On Black Primer", "#121212", "Primer"),             // PRIME 017
  p("Red Oxide Primer", "#6D2B15", "Primer"),                  // PRIME 019
  p("Dark Purple Primer", "#3C0A6E", "Primer"),                // PRIME 023
  p("Taupe Primer", "#8B7D6B", "Primer"),                      // PRIME 029

  // ── Médiums & Vernis ──────────────────────────────────
  p("Glaze & Wash Medium", "#F0F0F0", "Medium"),
  p("Matte Varnish", "#F0F0F0", "Medium"),
  p("Gloss Varnish", "#F5F5F5", "Medium"),
  p("NEWSH Acrylic Weathering Medium", "#E8E0D0", "Medium"),
];

/** Types de peinture Monument Hobbies */
export const MH_PAINT_TYPES: string[] = [
  "Standard",
  "Bold",
  "Metallic",
  "Transparent",
  "Wash",
  "Fluorescent",
  "Signature",
  "AMP",
  "Expert",
  "Primer",
  "Medium",
];

/** Couleurs CSS des badges par type */
export const MH_TYPE_COLORS: Record<string, string> = {
  Standard: "bg-blue-500/20 text-blue-400",
  Bold: "bg-orange-500/20 text-orange-400",
  Metallic: "bg-yellow-500/20 text-yellow-400",
  Transparent: "bg-sky-500/20 text-sky-400",
  Wash: "bg-amber-500/20 text-amber-400",
  Fluorescent: "bg-lime-500/20 text-lime-400",
  Signature: "bg-purple-500/20 text-purple-400",
  AMP: "bg-rose-500/20 text-rose-400",
  Expert: "bg-emerald-500/20 text-emerald-400",
  Primer: "bg-slate-500/20 text-slate-400",
  Medium: "bg-neutral-500/20 text-neutral-400",
};

/** Gamme Monument Hobbies Pro Acryl complète */
export const MONUMENT_HOBBIES_RANGE: PaintRange = {
  slug: "monument-hobbies",
  brand: "Monument Hobbies",
  name: "Pro Acryl",
  description: "",
  paints: MONUMENT_HOBBIES_PAINTS,
  paintTypes: MH_PAINT_TYPES,
  typeColors: MH_TYPE_COLORS,
};
