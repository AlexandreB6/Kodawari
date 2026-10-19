"use client";

import { memo } from "react";
import { Plus, Sparkles } from "lucide-react";
import { cn } from "@repo/core/utils";
import { cardImage, FINISH_LABEL, LANG_LABEL, type Card, type Finish, type Lang } from "@/data/catalog";
import type { CardSummary } from "@/lib/useCollection";

interface Props {
  card: Card;
  summary: CardSummary | undefined;
  /** Réglages d'ajout rapide, déjà ajustés aux finitions de la carte */
  finish: Finish;
  lang: Lang;
  onAdd: (card: Card) => void;
  onOpen: (card: Card) => void;
}

/**
 * Carte de la grille. Le CTA d'ajout apparaît au survol (ou au focus
 * clavier) ; sur écran tactile, un bouton « + » reste visible dans le coin.
 * Un clic sur la carte ouvre le détail.
 */
export const MtgCard = memo(function MtgCard({ card, summary, finish, lang, onAdd, onOpen }: Props) {
  const owned = !!summary;
  const addLabel = `Ajouter ${card.name} (${LANG_LABEL[lang]}, ${FINISH_LABEL[finish]})`;

  return (
    <div className="group relative [content-visibility:auto] [contain-intrinsic-size:auto_320px]">
      <button
        type="button"
        onClick={() => onOpen(card)}
        aria-label={`${card.name} — détails`}
        className={cn(
          "relative block w-full aspect-[63/88] overflow-hidden rounded-[4.75%/3.4%] bg-muted cursor-pointer",
          "transition-transform duration-200 group-hover:-translate-y-0.5",
          owned ? "ring-2 ring-rose-400/70 ring-offset-2 ring-offset-background" : "ring-1 ring-white/5",
        )}
      >
        {/* Nom en attendant l'image, qui le recouvre une fois chargée. Pas de
            fondu piloté par onLoad : une image déjà en cache se charge avant
            l'hydratation, l'événement est perdu et elle resterait invisible. */}
        <span className="absolute inset-0 flex items-center justify-center p-3 text-center text-xs text-muted-foreground">
          {card.name}
        </span>
        {/* <img> et non next/image : le CDN Scryfall sert déjà la bonne taille, mise en cache 1 an */}
        <img
          src={cardImage(card.id)}
          alt=""
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover"
        />
      </button>

      {/* Badges de possession */}
      {owned && (
        <div className="pointer-events-none absolute left-1.5 top-1.5 flex items-center gap-1">
          <span key={summary.total} className="animate-in zoom-in-50 duration-200 rounded-full bg-rose-500 px-2 py-0.5 text-xs font-bold text-white shadow">
            ×{summary.total}
          </span>
          {summary.foil && (
            <span className="rounded-full bg-black/70 p-1 text-amber-300 shadow" title="Foil">
              <Sparkles className="h-3 w-3" aria-label="Foil" />
            </span>
          )}
        </div>
      )}
      {owned && (
        <div className="pointer-events-none absolute right-1.5 top-1.5 flex flex-col items-end gap-0.5">
          {summary.langs.map((l) => (
            <span key={l} className="rounded bg-black/70 px-1 text-[9px] font-semibold leading-4 text-white/90">
              {LANG_LABEL[l]}
            </span>
          ))}
        </div>
      )}

      {/* CTA au survol (souris) ou au focus clavier */}
      <div
        className={cn(
          "absolute inset-x-0 bottom-0 flex flex-col items-center gap-1 rounded-b-[4.75%/3.4%] bg-gradient-to-t from-black/90 via-black/60 to-transparent px-2 pb-2 pt-8",
          "opacity-0 translate-y-1 transition-all duration-150 pointer-events-none",
          "group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto",
          "group-focus-within:opacity-100 group-focus-within:translate-y-0 group-focus-within:pointer-events-auto",
          "[@media(hover:none)]:hidden",
        )}
      >
        <button
          type="button"
          onClick={() => onAdd(card)}
          aria-label={addLabel}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-rose-500 px-2 py-1.5 text-xs font-semibold text-white shadow-lg transition-colors hover:bg-rose-400 cursor-pointer"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          Ajouter
        </button>
        <span className="text-[10px] font-medium text-white/80">
          {LANG_LABEL[lang]} · {FINISH_LABEL[finish]}
        </span>
      </div>

      {/* Tactile : ajout rapide toujours visible */}
      <button
        type="button"
        onClick={() => onAdd(card)}
        aria-label={addLabel}
        className="absolute bottom-1.5 right-1.5 hidden h-8 w-8 items-center justify-center rounded-full bg-rose-500 text-white shadow-lg active:scale-90 transition-transform [@media(hover:none)]:flex"
      >
        <Plus className="h-4 w-4" aria-hidden="true" />
      </button>

      <p className="mt-1.5 truncate px-0.5 text-xs text-muted-foreground" title={card.name}>
        <span className="tabular-nums">#{card.cn}</span> · {card.name}
      </p>
    </div>
  );
});
