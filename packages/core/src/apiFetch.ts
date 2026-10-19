import { toast } from "sonner";

/**
 * Crée une session invité (Better Auth, plugin anonymous). Appelé quand une
 * mutation est refusée faute de session : le visiteur n'a rien à faire, son
 * premier ajout crée sa collection d'essai.
 */
async function signInAsGuest(): Promise<boolean> {
  try {
    const res = await fetch("/api/auth/sign-in/anonymous", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function isNoSession(res: Response): Promise<boolean> {
  if (res.status !== 401) return false;
  try {
    const body = (await res.clone().json()) as { code?: string };
    return body?.code === "NO_SESSION";
  } catch {
    return false;
  }
}

/**
 * Drop-in remplaçant `fetch` pour les mutations côté client.
 * Comportement identique à fetch() sauf que :
 * - sans session (401 `NO_SESSION`), un invité est créé et la requête rejouée
 *   une fois (le corps doit donc être rejouable : une chaîne JSON) ;
 * - un toast d'erreur s'affiche automatiquement quand la réponse n'est pas
 *   ok — le message provient du corps JSON `{ error }` renvoyé par l'API si
 *   disponible, sinon un fallback générique selon le statut.
 */
export async function apiFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  let res: Response;
  try {
    res = await fetch(input, init);
    if ((await isNoSession(res)) && (await signInAsGuest())) {
      res = await fetch(input, init);
    }
  } catch (e) {
    toast.error("Erreur réseau — impossible de contacter le serveur.");
    throw e;
  }

  if (!res.ok) {
    let message = "Une erreur est survenue.";
    try {
      const clone = res.clone();
      const body = (await clone.json()) as { error?: string };
      if (body?.error) message = body.error;
      else if (res.status === 401) message = "Non autorisé — veuillez vous reconnecter.";
      else if (res.status === 403) message = "Action non autorisée.";
      else if (res.status === 404) message = "Élément introuvable.";
    } catch {
      // body not JSON — keep fallback
    }
    toast.error(message);
  }

  return res;
}
