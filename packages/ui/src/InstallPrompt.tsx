"use client";

import { useEffect, useState } from "react";
import { Download, Share, X } from "lucide-react";

/** Événement Chromium non typé par lib.dom. */
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "kodawari:install-dismissed-at";
const DISMISS_MS = 30 * 24 * 60 * 60 * 1000;

function isStandalone(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

/** iPhone / iPad, y compris l'iPad qui se déclare « MacIntel ». */
function isIos(): boolean {
  return (
    /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

function wasDismissedRecently(): boolean {
  try {
    const at = Number(localStorage.getItem(DISMISS_KEY));
    return !!at && Date.now() - at < DISMISS_MS;
  } catch {
    return false;
  }
}

/**
 * Bandeau « Installer l'app » sous le header.
 *
 * - Chrome / Edge / Android : capte `beforeinstallprompt` et propose un
 *   bouton qui ouvre la vraie boîte d'installation.
 * - iOS : aucun événement n'existe, on affiche la marche à suivre
 *   (Partager → Sur l'écran d'accueil).
 * - Masqué en mode standalone (déjà installée) et pendant 30 jours après
 *   fermeture. Ailleurs (Firefox desktop…), rien ne s'affiche.
 */
export function InstallPrompt({ appName }: { appName: string }) {
  const [mode, setMode] = useState<"hidden" | "prompt" | "ios">("hidden");
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (isStandalone() || wasDismissedRecently()) return;
    if (isIos()) {
      setMode("ios");
      return;
    }

    const onBeforeInstall = (e: Event) => {
      e.preventDefault(); // garde la main sur le moment où la boîte s'ouvre
      setDeferred(e as BeforeInstallPromptEvent);
      setMode("prompt");
    };
    const onInstalled = () => setMode("hidden");

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  function dismiss() {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      // Stockage indisponible (navigation privée…) : le bandeau reviendra.
    }
    setMode("hidden");
  }

  async function install() {
    if (!deferred) return;
    await deferred.prompt();
    const { outcome } = await deferred.userChoice;
    setDeferred(null); // un événement ne sert qu'une fois
    if (outcome === "accepted") setMode("hidden");
    else dismiss();
  }

  if (mode === "hidden") return null;

  return (
    <div className="border-b border-border/50 bg-muted/30 text-xs">
      <div className="max-w-7xl mx-auto px-safe sm:[--gutter:1.5rem] py-2 flex items-center gap-3">
        <Download className="w-3.5 h-3.5 flex-shrink-0 text-primary" aria-hidden="true" />
        <p className="flex-1 text-muted-foreground">
          {mode === "prompt" ? (
            <>
              <strong className="font-semibold text-foreground">{appName}</strong>{" "}
              s&apos;installe comme une app, en plein écran depuis votre écran d&apos;accueil.
            </>
          ) : (
            <>
              Installez <strong className="font-semibold text-foreground">{appName}</strong> : touchez{" "}
              <Share className="inline w-3.5 h-3.5 -mt-0.5" aria-label="Partager" /> puis{" "}
              <strong className="font-semibold text-foreground">« Sur l&apos;écran d&apos;accueil »</strong>.
            </>
          )}
        </p>
        {mode === "prompt" && (
          <button
            type="button"
            onClick={install}
            className="rounded-md bg-primary px-3 py-1 font-medium text-primary-foreground hover:opacity-90 transition-opacity cursor-pointer"
          >
            Installer
          </button>
        )}
        <button
          type="button"
          onClick={dismiss}
          className="rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          aria-label="Masquer"
          title="Masquer"
        >
          <X className="w-3.5 h-3.5" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
