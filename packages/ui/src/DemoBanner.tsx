"use client";

import { useState } from "react";
import { Info, RotateCcw, Github } from "lucide-react";

/**
 * Rendu uniquement côté démo (NEXT_PUBLIC_DEMO_MODE === "true") via rendu
 * conditionnel dans layout.tsx. Affiche un bandeau sticky pour avertir le
 * visiteur que ses données sont isolées et peuvent être réinitialisées.
 */
export function DemoBanner() {
  const [resetting, setResetting] = useState(false);

  async function handleReset() {
    if (!confirm("Réinitialiser votre session démo ? Tous vos ajouts seront supprimés.")) return;
    setResetting(true);
    try {
      const res = await fetch("/api/demo/reset", { method: "POST" });
      if (res.ok) window.location.reload();
      else alert("La réinitialisation a échoué.");
    } finally {
      setResetting(false);
    }
  }

  return (
    <div className="bg-amber-500/10 border-b border-amber-500/20 text-amber-200 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Info className="w-3.5 h-3.5 flex-shrink-0" aria-hidden="true" />
          <span>
            <strong className="font-semibold">Mode démo</strong> — vos ajouts sont isolés et réinitialisés chaque jour.
          </span>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="https://github.com/AlexandreB6/Kodawari"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 hover:text-amber-100 transition-colors"
          >
            <Github className="w-3.5 h-3.5" aria-hidden="true" />
            Code source
          </a>
          <button
            type="button"
            onClick={handleReset}
            disabled={resetting}
            className="inline-flex items-center gap-1 hover:text-amber-100 transition-colors disabled:opacity-50"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            {resetting ? "Réinitialisation…" : "Reset ma session"}
          </button>
        </div>
      </div>
    </div>
  );
}
