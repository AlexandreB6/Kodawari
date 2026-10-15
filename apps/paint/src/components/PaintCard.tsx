"use client";

import { cn } from "@repo/core/utils";
import { Minus, Plus } from "lucide-react";
import type { Paint } from "@/data/paint-types";

/** Props pour la carte d'une peinture */
interface PaintCardProps {
  paint: Paint;
  quantity: number;
  typeColors: Record<string, string>;
  isShared?: boolean;
  onAdd: () => void;
  onRemove: () => void;
  onIncrement: () => void;
  onDecrement: () => void;
}

/**
 * Détermine si une couleur hex est claire (pour adapter le texte superposé).
 * Utilise la formule de luminance perçue ITU-R BT.601.
 */
function isLightColor(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 160;
}

/**
 * Carte d'une peinture — affiche le swatch de couleur, le nom,
 * le type et les boutons d'ajout/quantité. Générique, fonctionne pour toutes les gammes.
 */
export function PaintCard({
  paint,
  quantity,
  typeColors,
  isShared = false,
  onAdd,
  onRemove,
  onIncrement,
  onDecrement,
}: PaintCardProps) {
  const inStock = quantity > 0;

  return (
    <div
      className={cn(
        "group relative rounded-xl border border-border/50 bg-card p-3 transition-all hover:border-border",
        inStock && "ring-1 ring-primary/30"
      )}
    >
      {/* Color swatch */}
      {/* TODO: Vérifier le contraste WCAG sur les swatches de couleur dynamiques */}
      <div
        className={cn(
          "relative mb-3 flex h-16 items-center justify-center rounded-lg border border-white/10",
          paint.metallic && "bg-gradient-to-br"
        )}
        style={
          paint.metallic
            ? {
                backgroundImage: `linear-gradient(135deg, ${paint.hex}, #fff 50%, ${paint.hex} 80%)`,
              }
            : { backgroundColor: paint.hex }
        }
      >
        {inStock && (
          <span
            className={cn(
              "text-sm font-bold",
              isLightColor(paint.hex) ? "text-black/70" : "text-white/70"
            )}
          >
            x{quantity}
          </span>
        )}
        {/* Badge métallique — décoratif, l'info est dans le filtre */}
        {paint.metallic && (
          <span className="absolute top-1 right-1 text-[9px] font-bold text-white/70 bg-black/40 rounded px-1" aria-hidden="true">
            M
          </span>
        )}
      </div>

      {/* Info */}
      <p className="text-sm font-medium leading-tight truncate" title={paint.name}>
        {paint.name}
      </p>
      <div className="mt-1 flex items-center gap-2">
        <span
          className={cn(
            "inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
            typeColors[paint.type] ?? "bg-muted text-muted-foreground"
          )}
        >
          {paint.type}
        </span>
        <span className="text-[10px] text-muted-foreground uppercase">
          {paint.hex}
        </span>
      </div>

      {/* Actions */}
      <div className="mt-3 flex items-center gap-1">
        {isShared ? (
          <span
            className="w-full text-center rounded-md bg-amber-500/10 border border-amber-500/20 px-2 py-1 text-[10px] font-medium text-amber-300"
            title="Cette peinture fait partie du catalogue de démonstration et ne peut pas être modifiée."
          >
            Catalogue partagé
          </span>
        ) : !inStock ? (
          <button
            onClick={onAdd}
            aria-label={`Ajouter ${paint.name} à l'inventaire`}
            className="w-full rounded-md bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20 transition-colors cursor-pointer"
          >
            Ajouter
          </button>
        ) : (
          <>
            <button
              onClick={quantity === 1 ? onRemove : onDecrement}
              aria-label={`Diminuer la quantité de ${paint.name}`}
              className="flex h-7 w-7 items-center justify-center rounded-md bg-muted hover:bg-destructive/20 hover:text-destructive transition-colors"
            >
              <Minus className="h-3 w-3" aria-hidden="true" />
            </button>
            <span className="flex-1 text-center text-sm font-semibold">
              {quantity}
            </span>
            <button
              onClick={onIncrement}
              aria-label={`Augmenter la quantité de ${paint.name}`}
              className="flex h-7 w-7 items-center justify-center rounded-md bg-muted hover:bg-primary/20 hover:text-primary transition-colors"
            >
              <Plus className="h-3 w-3" aria-hidden="true" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
