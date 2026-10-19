"use client";

import { useEffect, useState } from "react";
import { RotateCcw } from "lucide-react";
import { LANGUAGES } from "@/data/catalog";
import { DEFAULT_LANG_COEFFICIENTS, parseCoefficients, type LangCoefficients } from "@/lib/pricing";

const STORAGE_KEY = "tcg:lang-coefficients";

/**
 * Coefficients de langue, retenus sur cet appareil. Valeurs par défaut au
 * premier rendu (identiques serveur / client), puis celles enregistrées.
 */
export function useLangCoefficients() {
  const [coefficients, setCoefficients] = useState<LangCoefficients>(DEFAULT_LANG_COEFFICIENTS);
  useEffect(() => {
    try {
      setCoefficients(parseCoefficients(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null")));
    } catch {}
  }, []);
  const save = (next: LangCoefficients) => {
    setCoefficients(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {}
  };
  return [coefficients, save] as const;
}

/** Réglage des coefficients, en % du prix anglais. */
export function PriceSettings({
  coefficients,
  onChange,
}: {
  coefficients: LangCoefficients;
  onChange: (next: LangCoefficients) => void;
}) {
  return (
    <div className="ff-window space-y-3 p-4">
      <div className="flex items-start gap-3">
        <div className="flex-1 text-xs text-muted-foreground">
          <p className="font-semibold text-foreground">Prix selon la langue</p>
          <p className="mt-1">
            Cardmarket ne publie qu&apos;un prix par carte, toutes langues confondues. Chaque exemplaire est estimé à
            ce prix × le coefficient de sa langue. L&apos;état n&apos;est pas suivi : tout est compté en Near Mint.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onChange(DEFAULT_LANG_COEFFICIENTS)}
          className="flex h-7 shrink-0 items-center gap-1 rounded-full px-2.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
        >
          <RotateCcw className="h-3 w-3" aria-hidden="true" />
          Défaut
        </button>
      </div>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
        {LANGUAGES.map((l) => (
          <PercentInput
            key={l.id}
            label={l.label}
            title={l.name}
            value={coefficients[l.id]}
            onChange={(v) => onChange({ ...coefficients, [l.id]: v })}
          />
        ))}
      </div>
    </div>
  );
}

/** Champ en %, appliqué quand la saisie est valide (0 à 1000). */
function PercentInput({
  label,
  title,
  value,
  onChange,
}: {
  label: string;
  title: string;
  value: number;
  onChange: (v: number) => void;
}) {
  const [text, setText] = useState(String(Math.round(value * 100)));
  useEffect(() => setText(String(Math.round(value * 100))), [value]);

  return (
    <label className="flex items-center gap-1.5 rounded-md bg-muted/60 px-2 py-1 text-xs" title={title}>
      <span className="w-8 font-semibold">{label}</span>
      <input
        type="number"
        inputMode="numeric"
        min={0}
        max={1000}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          const n = Number(e.target.value);
          if (e.target.value !== "" && n >= 0 && n <= 1000) onChange(n / 100);
        }}
        className="w-full min-w-0 bg-transparent text-right tabular-nums focus:outline-none"
      />
      <span className="text-muted-foreground">%</span>
    </label>
  );
}
