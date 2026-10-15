import { BookOpen, Film, Paintbrush } from "lucide-react";

export type AppId = "film" | "manga" | "paint";

/**
 * Les 3 apps de la suite. Les URLs viennent des variables publiques
 * `NEXT_PUBLIC_APP_URL_*` (localhost en dev, domaine perso plus tard) ; à
 * défaut, celles de production. Chaque `process.env.NEXT_PUBLIC_*` doit rester
 * écrit en toutes lettres pour que Next l'inline au build.
 */
const APPS: { id: AppId; label: string; href: string; icon: typeof Film; color: string; hover: string }[] = [
  {
    id: "film",
    label: "Cinéma",
    href: process.env.NEXT_PUBLIC_APP_URL_FILM || "https://kodawari-film.vercel.app",
    icon: Film,
    color: "text-blue-400",
    hover: "group-hover:text-blue-400",
  },
  {
    id: "manga",
    label: "Manga",
    href: process.env.NEXT_PUBLIC_APP_URL_MANGA || "https://kodawari-manga.vercel.app",
    icon: BookOpen,
    color: "text-violet-400",
    hover: "group-hover:text-violet-400",
  },
  {
    id: "paint",
    label: "Peinture",
    href: process.env.NEXT_PUBLIC_APP_URL_PAINT || "https://kodawari-paint.vercel.app",
    icon: Paintbrush,
    color: "text-amber-400",
    hover: "group-hover:text-amber-400",
  },
];

/**
 * Sélecteur d'apps du header : une pastille par app, l'app courante en
 * surbrillance. Les autres sont des liens absolus (autre origine), donc de
 * simples <a> et non des <Link>.
 */
export function AppSwitcher({ current }: { current: AppId }) {
  return (
    <nav aria-label="Applications Kodawari" className="flex items-center gap-0.5 rounded-lg bg-muted/40 p-0.5">
      {APPS.map(({ id, label, href, icon: Icon, color, hover }) =>
        id === current ? (
          <span
            key={id}
            aria-current="page"
            title={label}
            className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-muted"
          >
            <Icon className={`h-4 w-4 ${color}`} aria-hidden="true" />
            <span className="sr-only">{label} (app actuelle)</span>
          </span>
        ) : (
          <a
            key={id}
            href={href}
            title={label}
            className="group inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted"
          >
            <Icon className={`h-4 w-4 transition-colors ${hover}`} aria-hidden="true" />
            <span className="sr-only">{label}</span>
          </a>
        ),
      )}
    </nav>
  );
}
