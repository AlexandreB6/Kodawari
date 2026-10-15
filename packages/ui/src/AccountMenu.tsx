"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogIn, LogOut, UserRound } from "lucide-react";
import { authClient } from "@repo/auth/client";

/** Le strict nécessaire de l'utilisateur, sérialisable vers le client. */
export interface AccountUser {
  name: string;
  email: string;
  image: string | null;
  isAnonymous: boolean;
}

const LINK_CLASS =
  "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors";

/**
 * Bouton de compte du header :
 * - sans session → « Connexion » ;
 * - invité → pastille « Invité » qui mène à l'inscription ;
 * - connecté → avatar et menu (identité + déconnexion).
 */
export function AccountMenu({ user }: { user: AccountUser | null }) {
  if (!user) {
    return (
      <Link href="/login" className={LINK_CLASS} title="Se connecter">
        <LogIn className="w-3.5 h-3.5" aria-hidden="true" />
        <span className="hidden sm:inline">Connexion</span>
      </Link>
    );
  }

  if (user.isAnonymous) {
    return (
      <Link
        href="/login?mode=signup"
        className={LINK_CLASS}
        title="Créez un compte pour garder votre collection"
      >
        <UserRound className="w-3.5 h-3.5" aria-hidden="true" />
        <span>Invité</span>
        <span className="hidden sm:inline text-primary">· Créer un compte</span>
      </Link>
    );
  }

  return <SignedInMenu user={user} />;
}

function SignedInMenu({ user }: { user: AccountUser }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // Fermeture au clic extérieur et à Échap.
  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function signOut() {
    setPending(true);
    await authClient.signOut();
    setOpen(false);
    setPending(false);
    router.push("/");
    router.refresh();
  }

  const initial = (user.name || user.email).charAt(0).toUpperCase();

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Mon compte"
        className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-primary/15 text-xs font-semibold text-primary ring-offset-background hover:ring-2 hover:ring-border transition-shadow cursor-pointer"
      >
        {user.image ? (
          // eslint-disable-next-line @next/next/no-img-element -- avatar Google, domaine variable
          <img src={user.image} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" />
        ) : (
          initial
        )}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-2 w-60 rounded-lg border border-border bg-popover p-1 text-sm shadow-lg z-50"
        >
          <div className="px-3 py-2">
            <p className="font-medium truncate">{user.name}</p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </div>
          <div className="my-1 h-px bg-border" />
          <button
            type="button"
            role="menuitem"
            onClick={signOut}
            disabled={pending}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer disabled:opacity-50"
          >
            <LogOut className="w-4 h-4" aria-hidden="true" />
            {pending ? "Déconnexion…" : "Se déconnecter"}
          </button>
        </div>
      )}
    </div>
  );
}
