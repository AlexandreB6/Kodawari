"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { ChevronLeft, ChevronRight, Gem, Maximize2, Minimize2, X } from "lucide-react";
import { cn } from "@repo/core/utils";
import type { Card } from "@/data/catalog";
import { BinderPage } from "./BinderPage";

type Side =
  | { kind: "empty" }
  | { kind: "front" }
  | { kind: "inside" }
  | { kind: "page"; number: number; cards: Card[] };

type Turn = "next" | "prev" | null;

interface Props {
  pages: Card[][];
  renderCard: (card: Card) => React.ReactNode;
  title: string;
  subtitle: string;
  /** Flèches du clavier actives (désactivées quand un dialog est ouvert) */
  keyboard: boolean;
}

const EMPTY: Side = { kind: "empty" };
const FRONT: Side = { kind: "front" };
const INSIDE: Side = { kind: "inside" };

function useMediaQuery(query: string) {
  return useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

/**
 * Classeur feuilletable : couverture, puis doubles pages (une page à la
 * fois sous `lg`) qui se tournent en 3D. Seules les faces visibles et la
 * feuille en mouvement sont rendues, quel que soit le nombre de pages.
 *
 * Grand écran : les faces s'enchaînent [vide, couverture, intérieur, p1, p2…]
 * et la double page n° s montre les faces 2s et 2s+1. La couverture se
 * tourne comme une feuille : l'ouvrir, c'est passer de la double page 0 à 1.
 */
export function BinderBook({ pages, renderCard, title, subtitle, keyboard }: Props) {
  const wide = useMediaQuery("(min-width: 1024px)");
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const [pos, setPos] = useState(0);
  const [turn, setTurn] = useState<Turn>(null);

  const pageSides: Side[] = pages.map((cards, i) => ({ kind: "page", number: i + 1, cards }));
  let sides: Side[];
  if (wide) {
    sides = [EMPTY, FRONT, INSIDE, ...pageSides];
    if (sides.length % 2) sides.push(INSIDE);
  } else {
    sides = [FRONT, ...(pageSides.length ? pageSides : [INSIDE])];
  }
  const max = wide ? sides.length / 2 - 1 : sides.length - 1;

  // Changement de mise en page : retour à la couverture. Filtres : on reste
  // dans les bornes.
  useEffect(() => setPos(0), [wide]);
  useEffect(() => setPos((p) => Math.min(p, max)), [max]);

  const go = useCallback(
    (dir: "next" | "prev") => {
      if (turn) return;
      if (dir === "next" ? pos >= max : pos <= 0) return;
      if (reducedMotion) setPos((p) => p + (dir === "next" ? 1 : -1));
      else setTurn(dir);
    },
    [turn, pos, max, reducedMotion],
  );

  const endTurn = (e: React.AnimationEvent) => {
    // Les animations des cartes (badge ×N…) remontent jusqu'ici : seule
    // celle de la feuille termine le tour de page.
    if (e.target !== e.currentTarget) return;
    setPos((p) => p + (turn === "next" ? 1 : -1));
    setTurn(null);
  };

  useEffect(() => {
    if (!keyboard) return;
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return;
      if (e.key === "ArrowRight") go("next");
      if (e.key === "ArrowLeft") go("prev");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [keyboard, go]);

  // Balayage horizontal sur mobile
  const touchX = useRef<number | null>(null);
  const onTouchStart = (e: React.TouchEvent) => (touchX.current = e.touches[0].clientX);
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    touchX.current = null;
    if (Math.abs(dx) > 50) go(dx < 0 ? "next" : "prev");
  };

  const open = () => go("next");
  // Depuis la première (double) page, on referme en tournant la couverture ;
  // plus loin, on revient directement à la couverture.
  const close = () => {
    if (turn) return;
    if (pos === 1) go("prev");
    else setPos(0);
  };

  const renderSide = (side: Side, place: "left" | "right" | "single") => {
    switch (side.kind) {
      case "empty":
        return <div />;
      case "front":
        return <Cover title={title} subtitle={subtitle} onOpen={open} />;
      case "inside":
        return <Inside place={place} />;
      case "page":
        return (
          <BinderPage
            number={side.number}
            holes={place === "left" ? "right" : "left"}
            className={cn(
              "h-full",
              place === "left" && "rounded-r-md",
              place === "right" && "rounded-l-md",
            )}
          >
            {side.cards.map(renderCard)}
          </BinderPage>
        );
    }
  };

  // Feuille en mouvement : recto = face qui part, verso = face qui arrive.
  const leaf = (front: Side, back: Side, place: "left" | "right" | "single", animation: string, origin: string) => (
    <div
      className={cn("pointer-events-none relative z-10 grid [transform-style:preserve-3d]", STACK, origin, animation)}
      onAnimationEnd={endTurn}
    >
      <div className="[backface-visibility:hidden]">{renderSide(front, place)}</div>
      <div className="[backface-visibility:hidden] [transform:rotateY(180deg)]">
        {renderSide(back, place === "right" ? "left" : place === "left" ? "right" : "single")}
      </div>
    </div>
  );

  // ── Plein écran : API Fullscreen si dispo (masque le navigateur), sinon
  // simple calque fixe par-dessus la page (iPhone). ──
  const rootRef = useRef<HTMLDivElement>(null);
  const [full, setFull] = useState(false);
  const toggleFull = () => {
    if (full) {
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
      setFull(false);
    } else {
      setFull(true);
      rootRef.current?.requestFullscreen?.().catch(() => {});
    }
  };
  useEffect(() => {
    if (!full) return;
    // Sortie par Échap (gérée par le navigateur en plein écran natif)
    const onFsChange = () => !document.fullscreenElement && setFull(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && keyboard && setFull(false);
    document.addEventListener("fullscreenchange", onFsChange);
    window.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("fullscreenchange", onFsChange);
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [full, keyboard]);

  const isOpen = pos > 0 || turn !== null;
  // Fermé, seule la couverture (colonne de droite) est visible : on décale le
  // livre d'un quart pour la centrer. Il glisse à droite pendant qu'elle
  // s'ouvre, et revient au centre quand on la referme.
  const centered = (pos === 0 && turn !== "next") || (pos === 1 && turn === "prev");
  const visibleNumbers = (wide ? [sides[2 * pos], sides[2 * pos + 1]] : [sides[pos]])
    .filter((s): s is Extract<Side, { kind: "page" }> => s?.kind === "page")
    .map((s) => s.number);

  return (
    <div
      ref={rootRef}
      className={cn(
        "space-y-4",
        // m-0 : le space-y du parent donnerait une marge qui raccourcit le calque
        full && "night-sky fixed inset-0 z-[60] m-0 flex flex-col items-center justify-center gap-4 space-y-0 overflow-hidden p-4",
      )}
    >
      <div
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        className={cn("relative mx-auto max-w-6xl", full && "w-full max-w-none")}
        // Plein écran : la largeur suit la hauteur disponible pour que la
        // (double) page tienne entière. Ratio largeur / hauteur mesuré d'une
        // double page ≈ 2, d'une page seule ≈ 0,95 (un peu de marge en plus).
        style={full ? { maxWidth: `calc((100dvh - 6rem) * ${wide ? 1.95 : 0.9})` } : undefined}
      >
        {wide ? (
          <div
            className={cn(
              "relative grid grid-cols-2 transition-transform duration-700 ease-in-out motion-reduce:transition-none",
              centered && "-translate-x-1/4",
            )}
          >
            {/* Page de gauche */}
            {/* La colonne de la feuille qui tourne passe devant l'autre */}
            <div className={cn("relative grid [perspective:2600px] [perspective-origin:right_center]", STACK, turn === "prev" && "z-10")}>
              <Sizer />
              {renderSide(turn === "prev" ? sides[2 * pos - 2] : sides[2 * pos], "left")}
              {turn === "prev" &&
                leaf(sides[2 * pos], sides[2 * pos - 1], "left", "animate-[turn-prev_700ms_ease-in-out_forwards]", "origin-right")}
            </div>
            {/* Page de droite */}
            <div className={cn("relative grid [perspective:2600px] [perspective-origin:left_center]", STACK, turn === "next" && "z-10")}>
              <Sizer />
              {renderSide(turn === "next" ? sides[2 * pos + 3] : sides[2 * pos + 1], "right")}
              {turn === "next" &&
                leaf(sides[2 * pos + 1], sides[2 * pos + 2], "right", "animate-[turn-next_700ms_ease-in-out_forwards]", "origin-left")}
            </div>
            {/* Anneaux de la reliure, par-dessus les pages */}
            {isOpen && <Rings />}
          </div>
        ) : (
          <div className={cn("mx-auto grid max-w-xl [perspective:2000px] [perspective-origin:left_center]", STACK)}>
            <Sizer />
            {renderSide(turn === "next" ? sides[pos + 1] : sides[pos], "single")}
            {turn === "next" && leaf(sides[pos], INSIDE, "single", "animate-[turn-next_600ms_ease-in-out_forwards]", "origin-left")}
            {/* Retour : la page précédente revient se poser (animation inversée) */}
            {turn === "prev" &&
              leaf(sides[pos - 1], INSIDE, "single", "animate-[turn-next_600ms_ease-in-out_reverse_forwards]", "origin-left")}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex flex-wrap items-center justify-center gap-2">
        {isOpen && (
          <>
            <NavButton label="Page précédente" onClick={() => go("prev")} disabled={pos <= 1 || !!turn}>
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            </NavButton>
            <span className="min-w-28 text-center text-sm tabular-nums text-muted-foreground" aria-live="polite">
              {visibleNumbers.length
                ? `${visibleNumbers.length > 1 ? "Pages" : "Page"} ${visibleNumbers.join("–")} / ${pages.length}`
                : pages.length
                  ? `${pages.length} page${pages.length > 1 ? "s" : ""}`
                  : "Classeur vide"}
            </span>
            <NavButton label="Page suivante" onClick={() => go("next")} disabled={pos >= max || !!turn}>
              <ChevronRight className="h-5 w-5" aria-hidden="true" />
            </NavButton>
            <TextButton onClick={close}>
              <X className="h-3.5 w-3.5" aria-hidden="true" />
              Fermer
            </TextButton>
          </>
        )}
        <TextButton onClick={toggleFull}>
          {full ? (
            <Minimize2 className="h-3.5 w-3.5" aria-hidden="true" />
          ) : (
            <Maximize2 className="h-3.5 w-3.5" aria-hidden="true" />
          )}
          {full ? "Quitter le plein écran" : "Plein écran"}
        </TextButton>
      </div>
    </div>
  );
}

function TextButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-9 items-center gap-1 rounded-full px-3 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
    >
      {children}
    </button>
  );
}

/** Empile les enfants dans la même cellule de grille. */
const STACK = "[&>*]:col-start-1 [&>*]:row-start-1";

/** Page vide et invisible : donne sa hauteur à la colonne, même couverture seule. */
function Sizer() {
  return (
    <div aria-hidden="true" className="invisible">
      <BinderPage />
    </div>
  );
}

const LEATHER =
  "bg-[radial-gradient(ellipse_at_30%_15%,oklch(0.36_0.12_264),oklch(0.2_0.08_267)_55%,oklch(0.15_0.06_268))]";

function Cover({ title, subtitle, onOpen }: { title: string; subtitle: string; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label="Ouvrir le classeur"
      className={cn(
        "group relative flex h-full w-full flex-col items-center justify-center gap-3 overflow-hidden rounded-2xl rounded-l-md border-2 border-gold/50 p-6 text-center shadow-[0_24px_50px_-20px_oklch(0.05_0.03_270/0.95)] cursor-pointer",
        LEATHER,
      )}
    >
      {/* Cadre doré et coutures */}
      <span aria-hidden="true" className="absolute inset-3 rounded-xl border border-gold/40" />
      <span aria-hidden="true" className="absolute inset-5 rounded-lg border border-dashed border-gold/20" />
      {/* Dos de la reliure */}
      <span aria-hidden="true" className="absolute inset-y-0 left-0 w-4 bg-gradient-to-r from-black/40 to-transparent" />

      <Gem className="h-12 w-12 text-gold drop-shadow-[0_0_12px_var(--gold)] sm:h-16 sm:w-16" aria-hidden="true" />
      <p className="text-[10px] font-semibold uppercase tracking-[0.35em] text-gold/70">Kodawari</p>
      <h2 className="text-3xl font-extrabold tracking-tight text-gold sm:text-5xl">{title}</h2>
      <p className="text-sm text-gold/70">{subtitle}</p>
      <span className="mt-4 rounded-full border border-gold/50 px-4 py-1.5 text-xs font-semibold text-gold transition-colors group-hover:bg-gold group-hover:text-gold-foreground">
        Ouvrir le classeur
      </span>
    </button>
  );
}

/** Intérieur de couverture. */
function Inside({ place }: { place: "left" | "right" | "single" }) {
  return (
    <div
      className={cn(
        "relative flex h-full items-center justify-center rounded-2xl border border-white/10",
        place === "left" && "rounded-r-md",
        place === "right" && "rounded-l-md",
        LEATHER,
      )}
    >
      <Gem className="h-10 w-10 text-gold/15" aria-hidden="true" />
    </div>
  );
}

/**
 * Trois anneaux métalliques posés sur la reliure, entre les deux pages.
 * Le padding en % se calcule sur la largeur : 9 % du livre = 18 % d'une
 * page, pour tomber en face des trous de BinderPage.
 */
function Rings() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-1/2 z-20 flex -translate-x-1/2 flex-col justify-around py-[9%]">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="block h-3.5 w-14 rounded-full bg-gradient-to-b from-zinc-100 via-zinc-400 to-zinc-700 shadow-[0_3px_6px_oklch(0_0_0/0.6)]"
        />
      ))}
    </div>
  );
}

function NavButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-white/70 bg-[oklch(0.3_0.11_265)] text-foreground shadow transition hover:bg-gold hover:text-gold-foreground hover:border-gold disabled:opacity-30 disabled:hover:bg-[oklch(0.3_0.11_265)] disabled:hover:text-foreground disabled:hover:border-white/70 cursor-pointer disabled:cursor-default"
    >
      {children}
    </button>
  );
}
