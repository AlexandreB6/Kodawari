"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Minus, Plus, RefreshCw, Sparkles, X } from "lucide-react";
import { cn } from "@repo/core/utils";
import {
  cardImage,
  FINISH_LABEL,
  LANG_LABEL,
  LANGUAGES,
  MAIN_LANGUAGES,
  RARITIES,
  SET_MAP,
  type Card,
  type Finish,
  type Lang,
} from "@/data/catalog";
import type { CardSummary } from "@/lib/useCollection";
import { Chip } from "./Chip";

interface Props {
  card: Card | null;
  summary: CardSummary | undefined;
  /** Réglages d'ajout rapide : valeurs initiales de la ligne « Ajouter » */
  defaultFinish: Finish;
  defaultLang: Lang;
  quantityOf: (id: string, finish: Finish, lang: Lang) => number;
  setQuantity: (id: string, finish: Finish, lang: Lang, quantity: number) => void;
  onPrev?: () => void;
  onNext?: () => void;
  onClose: () => void;
}

/**
 * Détail d'une carte : grande image, exemplaires possédés (finition × langue)
 * et ajout d'un exemplaire dans n'importe quelle combinaison.
 * <dialog> natif, comme ConfirmDialog : focus trap et Échap gratuits.
 */
export function CardDialog({
  card,
  summary,
  defaultFinish,
  defaultLang,
  quantityOf,
  setQuantity,
  onPrev,
  onNext,
  onClose,
}: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [back, setBack] = useState(false);
  const [finish, setFinish] = useState<Finish>(defaultFinish);
  const [lang, setLang] = useState<Lang>(defaultLang);

  // Nouvelle carte : recto, et réglages d'ajout rapide.
  useEffect(() => {
    if (!card) return;
    setBack(false);
    setFinish(card.finishes.includes(defaultFinish) ? defaultFinish : card.finishes[0]);
    setLang(defaultLang);
  }, [card, defaultFinish, defaultLang]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (card && !dialog.open) dialog.showModal();
    else if (!card && dialog.open) dialog.close();
  }, [card]);

  // Flèches gauche / droite : carte précédente / suivante du filtre courant.
  useEffect(() => {
    if (!card) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === "SELECT") return;
      if (e.key === "ArrowLeft") onPrev?.();
      if (e.key === "ArrowRight") onNext?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [card, onPrev, onNext]);

  const set = card ? SET_MAP.get(card.set) : undefined;
  const rarity = RARITIES.find((r) => r.id === card?.rarity);
  const lines = [...(summary?.lines ?? [])].sort(
    (a, b) => a.finish.localeCompare(b.finish) || a.lang.localeCompare(b.lang),
  );

  return (
    <dialog
      ref={dialogRef}
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      // Clic sur le fond (hors du contenu) : fermeture.
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className="m-auto w-full max-w-3xl max-h-[92dvh] overflow-y-auto ff-window p-0 text-foreground backdrop:bg-[oklch(0.1_0.05_268/0.75)] backdrop:backdrop-blur-sm"
    >
      {card && (
        <div className="grid gap-5 p-4 sm:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] sm:p-6">
          {/* Image */}
          <div className="relative mx-auto w-full max-w-xs sm:max-w-none">
            <div className="relative aspect-[63/88] overflow-hidden rounded-[4.75%/3.4%] bg-muted shadow-2xl">
              {/* key : repart d'une image vide plutôt que d'afficher la précédente */}
              <img
                key={`${card.id}-${back}`}
                src={cardImage(card.id, "large", back ? "back" : "front")}
                alt={card.name}
                className="h-full w-full object-cover"
              />
            </div>
            {card.dfc && (
              <button
                type="button"
                onClick={() => setBack((b) => !b)}
                className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-black/75 px-2.5 py-1 text-xs font-medium text-white hover:bg-black cursor-pointer"
              >
                <RefreshCw className="h-3 w-3" aria-hidden="true" />
                Retourner
              </button>
            )}
          </div>

          {/* Infos + exemplaires */}
          <div className="flex min-w-0 flex-col gap-5">
            <div className="flex items-start gap-2">
              <div className="min-w-0 flex-1">
                <h2 className="text-xl font-bold leading-tight">{card.name}</h2>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                  {set && <img src={set.icon} alt="" className="h-4 w-4 invert opacity-80" />}
                  <span className="truncate">{set && `${set.code.toUpperCase()} · ${set.name}`}</span>
                  <span className="tabular-nums">· #{card.cn}</span>
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {card.type}
                  {rarity && (
                    <>
                      {" · "}
                      <span style={{ color: rarity.color }}>{rarity.label}</span>
                    </>
                  )}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Fermer"
                className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md hover:bg-muted transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            {/* Exemplaires possédés */}
            <section className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Ma collection {summary && <span className="text-gold">· {summary.total}</span>}
              </h3>
              {lines.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucun exemplaire pour l&apos;instant.</p>
              ) : (
                <ul className="divide-y divide-border/50 rounded-lg border border-border/50">
                  {lines.map((l) => (
                    <li key={`${l.finish}-${l.lang}`} className="flex items-center gap-2 px-3 py-2">
                      <span className="w-9 rounded bg-muted px-1.5 py-0.5 text-center text-xs font-semibold">
                        {LANG_LABEL[l.lang]}
                      </span>
                      <span className={cn("flex flex-1 items-center gap-1 text-sm", l.finish !== "nonfoil" && "text-amber-300")}>
                        {l.finish !== "nonfoil" && <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />}
                        {FINISH_LABEL[l.finish]}
                      </span>
                      <Stepper
                        label={`${LANG_LABEL[l.lang]} ${FINISH_LABEL[l.finish]}`}
                        value={l.quantity}
                        onChange={(q) => setQuantity(card.id, l.finish, l.lang, q)}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Ajout d'un exemplaire */}
            <section className="space-y-3 rounded-xl bg-muted/40 p-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ajouter</h3>
              <div className="flex flex-wrap items-center gap-1.5">
                {MAIN_LANGUAGES.map((l) => (
                  <Chip key={l.id} active={lang === l.id} onClick={() => setLang(l.id)} title={l.name}>
                    {l.label}
                  </Chip>
                ))}
                <select
                  value={MAIN_LANGUAGES.some((l) => l.id === lang) ? "" : lang}
                  onChange={(e) => e.target.value && setLang(e.target.value as Lang)}
                  aria-label="Autre langue"
                  className="h-7 rounded-full border-0 bg-muted px-2 text-xs font-medium text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="">Autre…</option>
                  {LANGUAGES.slice(3).map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.label} — {l.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {card.finishes.map((f) => (
                  <Chip key={f} active={finish === f} onClick={() => setFinish(f)}>
                    {f !== "nonfoil" && <Sparkles className="h-3 w-3" aria-hidden="true" />}
                    {FINISH_LABEL[f]}
                  </Chip>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setQuantity(card.id, finish, lang, quantityOf(card.id, finish, lang) + 1)}
                className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-gold px-3 py-2 text-sm font-semibold text-gold-foreground transition hover:brightness-110 cursor-pointer"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                Ajouter · {LANG_LABEL[lang]} · {FINISH_LABEL[finish]}
              </button>
            </section>

            {/* Navigation dans le filtre courant */}
            {(onPrev || onNext) && (
              <div className="mt-auto flex justify-between">
                <NavButton onClick={onPrev} label="Carte précédente">
                  <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                  Précédente
                </NavButton>
                <NavButton onClick={onNext} label="Carte suivante">
                  Suivante
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </NavButton>
              </div>
            )}
          </div>
        </div>
      )}
    </dialog>
  );
}

/** − quantité + ; descendre à 0 retire la ligne. */
function Stepper({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => onChange(value - 1)}
        aria-label={`Retirer un exemplaire ${label}`}
        className="flex h-7 w-7 items-center justify-center rounded-md bg-muted hover:bg-destructive/20 hover:text-destructive transition-colors cursor-pointer"
      >
        <Minus className="h-3 w-3" aria-hidden="true" />
      </button>
      <span className="w-7 text-center text-sm font-semibold tabular-nums">{value}</span>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        aria-label={`Ajouter un exemplaire ${label}`}
        className="flex h-7 w-7 items-center justify-center rounded-md bg-muted hover:bg-gold/20 hover:text-gold transition-colors cursor-pointer"
      >
        <Plus className="h-3 w-3" aria-hidden="true" />
      </button>
    </div>
  );
}

function NavButton({ onClick, label, children }: { onClick?: () => void; label: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      aria-label={label}
      className="flex items-center gap-1 rounded-md px-2 py-1 text-sm text-muted-foreground hover:bg-muted hover:text-foreground disabled:invisible transition-colors cursor-pointer"
    >
      {children}
    </button>
  );
}
