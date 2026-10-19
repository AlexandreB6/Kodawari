import { cn } from "@repo/core/utils";
import { POCKET_CLASS } from "./MtgCard";

/** Pochettes par page : classeur de 12 cases, 4 colonnes × 3 rangées. */
export const POCKETS_PER_PAGE = 12;

interface Props {
  /** Numéro affiché en pied de page (absent : pas de numéro) */
  number?: number;
  /** Bord percé : à gauche par défaut, côté reliure pour une page de gauche ouverte */
  holes?: "left" | "right";
  className?: string;
  children?: React.ReactNode[];
}

/**
 * Page de classeur : trois trous d'anneaux sur un bord et une grille
 * de 4 × 3 pochettes. Les cases restantes de la dernière page restent vides.
 */
export function BinderPage({ number, holes = "left", className, children = [] }: Props) {
  const empty = POCKETS_PER_PAGE - children.length;

  return (
    <section
      aria-label={number ? `Page ${number}` : undefined}
      className={cn(
        "relative rounded-2xl border border-white/15 bg-[linear-gradient(160deg,oklch(0.28_0.09_265),oklch(0.21_0.075_268))] p-2.5 shadow-[0_18px_40px_-18px_oklch(0.05_0.03_270/0.9),inset_0_1px_0_oklch(1_0_0/0.06)] sm:p-4",
        holes === "left" ? "pl-8 sm:pl-11" : "pr-8 sm:pr-11",
        className,
      )}
    >
      {/* Trous d'anneaux */}
      <div
        aria-hidden="true"
        className={cn(
          "absolute inset-y-0 flex flex-col justify-around py-[18%]",
          holes === "left" ? "left-2.5 sm:left-3.5" : "right-2.5 sm:right-3.5",
        )}
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="block h-3 w-3 rounded-full bg-[oklch(0.13_0.05_268)] shadow-[inset_0_2px_3px_oklch(0_0_0/0.7)] ring-2 ring-[oklch(0.85_0.02_255/0.35)] sm:h-4 sm:w-4"
          />
        ))}
      </div>

      <div className="grid grid-cols-4 gap-1.5 sm:gap-2.5">
        {children}
        {Array.from({ length: empty }, (_, i) => (
          <div key={`empty-${i}`} className={`${POCKET_CLASS} border-dashed border-white/10`}>
            <div className="aspect-[63/88]" />
          </div>
        ))}
      </div>

      <p className="mt-2 text-right text-[11px] font-medium tracking-wider text-muted-foreground/80">
        {number ? `— ${number} —` : " "}
      </p>
    </section>
  );
}
