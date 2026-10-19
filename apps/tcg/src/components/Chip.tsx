import { cn } from "@repo/core/utils";

/** Pastille de choix (filtre, langue, finition), active en rose. */
export function Chip({
  active,
  onClick,
  title,
  children,
}: {
  active: boolean;
  onClick: () => void;
  title?: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-pressed={active}
      className={cn(
        "flex h-7 shrink-0 items-center gap-1 rounded-full px-3 text-xs font-medium transition-colors cursor-pointer",
        active ? "bg-rose-500 text-white" : "bg-muted text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}
