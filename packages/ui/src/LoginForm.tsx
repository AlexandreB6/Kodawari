"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { UserRound } from "lucide-react";
import { authClient } from "@repo/auth/client";

type Mode = "signin" | "signup";

/** Codes d'erreur Better Auth → messages en français. */
const ERROR_MESSAGES: Record<string, string> = {
  INVALID_EMAIL_OR_PASSWORD: "Email ou mot de passe incorrect.",
  USER_ALREADY_EXISTS: "Un compte existe déjà avec cet email.",
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: "Un compte existe déjà avec cet email.",
  PASSWORD_TOO_SHORT: "Le mot de passe doit faire au moins 8 caractères.",
  INVALID_EMAIL: "Adresse email invalide.",
};

function errorMessage(error: { code?: string; status?: number } | null): string {
  if (error?.code && ERROR_MESSAGES[error.code]) return ERROR_MESSAGES[error.code];
  if (error?.status === 429) return "Trop de tentatives, réessayez dans un instant.";
  return "Une erreur est survenue.";
}

export interface LoginFormProps {
  /** Affiche « Continuer avec Google » (identifiants OAuth configurés). */
  googleEnabled: boolean;
  /** Le visiteur est un invité : sa collection sera rattachée au compte. */
  isGuest: boolean;
  initialMode?: Mode;
}

/** Connexion / inscription, communes aux apps (Better Auth). */
export function LoginForm({ googleEnabled, isGuest, initialMode = "signin" }: LoginFormProps) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function done() {
    router.push("/");
    router.refresh();
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const { error } =
        mode === "signin"
          ? await authClient.signIn.email({ email, password })
          : await authClient.signUp.email({ name: name.trim() || email.split("@")[0], email, password });
      if (error) setError(errorMessage(error));
      else done();
    } catch {
      setError("Erreur réseau.");
    } finally {
      setPending(false);
    }
  }

  async function handleGoogle() {
    setError(null);
    setPending(true);
    // Redirige vers Google puis revient sur la home.
    const { error } = await authClient.signIn.social({ provider: "google", callbackURL: "/" });
    if (error) {
      setError(errorMessage(error));
      setPending(false);
    }
  }

  const inputClass =
    "w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary";

  return (
    <div className="max-w-sm mx-auto mt-12">
      <div className="flex items-center gap-2 mb-2">
        <UserRound className="w-5 h-5 text-primary" aria-hidden="true" />
        <h1 className="text-2xl font-bold tracking-tight">
          {mode === "signin" ? "Connexion" : "Créer un compte"}
        </h1>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        Un seul compte pour Cinéma, Manga et Peinture.
      </p>

      {isGuest && (
        <p className="mb-6 rounded-md border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-muted-foreground">
          Vous utilisez l&apos;app en invité : ce que vous avez ajouté sera rattaché à votre compte.
        </p>
      )}

      {/* Onglets */}
      <div className="mb-6 grid grid-cols-2 gap-1 rounded-lg bg-muted/40 p-1 text-sm" role="tablist">
        {(["signin", "signup"] as const).map((m) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={mode === m}
            onClick={() => {
              setMode(m);
              setError(null);
            }}
            className={`rounded-md py-1.5 font-medium transition-colors cursor-pointer ${
              mode === m ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {m === "signin" ? "Se connecter" : "S'inscrire"}
          </button>
        ))}
      </div>

      {googleEnabled && (
        <>
          <button
            type="button"
            onClick={handleGoogle}
            disabled={pending}
            className="flex w-full items-center justify-center gap-2 rounded-md border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted transition-colors cursor-pointer disabled:opacity-50"
          >
            <GoogleIcon />
            Continuer avec Google
          </button>
          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            ou par email
            <span className="h-px flex-1 bg-border" />
          </div>
        </>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === "signup" && (
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-1.5">
              Prénom ou pseudo
            </label>
            <input
              id="name"
              autoComplete="nickname"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={inputClass}
            />
          </div>
        )}
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1.5">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-1.5">
            Mot de passe
          </label>
          <input
            id="password"
            type="password"
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            minLength={8}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
          />
          {mode === "signup" && (
            <p className="mt-1 text-xs text-muted-foreground">8 caractères minimum.</p>
          )}
        </div>
        {error && (
          <p className="text-sm text-red-400" role="alert">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={pending || !email || !password}
          className="w-full rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity cursor-pointer"
        >
          {pending ? "Un instant…" : mode === "signin" ? "Se connecter" : "Créer mon compte"}
        </button>
      </form>
    </div>
  );
}

/** Logo Google officiel (4 couleurs), en ligne pour éviter une requête. */
function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.46a5.52 5.52 0 0 1-2.4 3.62v3h3.88c2.27-2.09 3.58-5.17 3.58-8.81z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.94-2.91l-3.88-3c-1.07.72-2.45 1.15-4.06 1.15-3.12 0-5.77-2.11-6.71-4.95H1.28v3.1A12 12 0 0 0 12 24z" />
      <path fill="#FBBC05" d="M5.29 14.29a7.2 7.2 0 0 1 0-4.58v-3.1H1.28a12 12 0 0 0 0 10.78l4.01-3.1z" />
      <path fill="#EA4335" d="M12 4.75c1.76 0 3.35.61 4.6 1.8l3.44-3.44A11.53 11.53 0 0 0 12 0 12 12 0 0 0 1.28 6.61l4.01 3.1C6.23 6.86 8.88 4.75 12 4.75z" />
    </svg>
  );
}
