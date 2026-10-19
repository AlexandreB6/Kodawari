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

/** Pochette de classeur : liseré, fond de plastique, ombre intérieure. */
export const POCKET_CLASS =
  "relative rounded-[0.6rem] border bg-[linear-gradient(160deg,oklch(1_0_0/0.07),oklch(1_0_0/0.02))] p-[5%] shadow-[inset_0_1px_0_oklch(1_0_0/0.08),inset_0_-8px_14px_-10px_oklch(0_0_0/0.6)]";

/**
 * Carte rangée dans sa pochette de classeur. Le CTA d'ajout apparaît au
 * survol (ou au focus clavier) ; sur écran tactile, un bouton « + » reste
 * visible dans le coin. Un clic sur la carte ouvre le détail.
 * Le survol ne déplace rien : seul le reflet de la pochette s'allume.
 */
export const MtgCard = memo(function MtgCard({ card, summary, finish, lang, onAdd, onOpen }: Props) {
  const owned = !!summary;
  const addLabel = `Ajouter ${card.name} (${LANG_LABEL[lang]}, ${FINISH_LABEL[finish]})`;

  return (
    <div
      className={cn(
        "group transition-[border-color,box-shadow] duration-200",
        POCKET_CLASS,
        owned
          ? "border-gold/80 shadow-[0_0_16px_-6px_var(--gold),inset_0_1px_0_oklch(1_0_0/0.08)]"
          : "border-white/15 hover:border-white/35",
      )}
    >
      <div className="relative">
        <button
          type="button"
          onClick={() => onOpen(card)}
          aria-label={`${card.name} — détails`}
          className="relative block w-full aspect-[63/88] overflow-hidden rounded-[4.75%/3.4%] bg-muted cursor-pointer"
        >
          {/* Nom en attendant l'image, qui le recouvre une fois chargée. Pas de
              fondu piloté par onLoad : une image déjà en cache se charge avant
              l'hydratation, l'événement est perdu et elle resterait invisible. */}
          <span className="absolute inset-0 flex items-center justify-center p-2 text-center text-[10px] text-muted-foreground">
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
          {/* Reflet du plastique de la pochette, plus vif au survol */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,transparent_30%,oklch(1_0_0/0.22)_45%,transparent_60%)] opacity-30 transition-opacity duration-300 group-hover:opacity-100"
          />
        </button>

        {/* Badges de possession */}
        {owned && (
          <div className="pointer-events-none absolute left-1 top-1 flex items-center gap-1">
            <span key={summary.total} className="animate-in zoom-in-50 duration-200 rounded-full bg-gold px-1.5 py-px text-[11px] font-bold text-gold-foreground shadow">
              ×{summary.total}
            </span>
            {summary.foil && (
              <span className="rounded-full bg-black/70 p-0.5 text-amber-300 shadow" title="Foil">
                <Sparkles className="h-3 w-3" aria-label="Foil" />
              </span>
            )}
          </div>
        )}
        {owned && (
          <div className="pointer-events-none absolute right-1 top-1 flex flex-col items-end gap-0.5">
            {summary.langs.map((l) => (
              <span key={l} className="rounded bg-black/70 px-1 text-[9px] font-semibold leading-4 text-white/90">
                {LANG_LABEL[l]}
              </span>
            ))}
          </div>
        )}

        {/* CTA au survol (souris) ou au focus clavier, contenu dans la carte */}
        <div
          className={cn(
            "absolute inset-x-0 bottom-0 flex flex-col items-center gap-1 rounded-b-[4.75%/3.4%] bg-gradient-to-t from-[oklch(0.15_0.07_266/0.95)] via-[oklch(0.2_0.08_266/0.6)] to-transparent px-1.5 pb-1.5 pt-6",
            "opacity-0 transition-opacity duration-150 pointer-events-none",
            "group-hover:opacity-100 group-hover:pointer-events-auto",
            "group-focus-within:opacity-100 group-focus-within:pointer-events-auto",
            "[@media(hover:none)]:hidden",
          )}
        >
          <button
            type="button"
            onClick={() => onAdd(card)}
            aria-label={addLabel}
            className="flex w-full items-center justify-center gap-1 rounded-md bg-gold px-2 py-1 text-xs font-semibold text-gold-foreground shadow-lg transition hover:brightness-110 cursor-pointer"
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
          className="absolute bottom-1 right-1 hidden h-7 w-7 items-center justify-center rounded-full bg-gold text-gold-foreground shadow-lg active:scale-90 transition-transform [@media(hover:none)]:flex"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
});
