"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { apiFetch } from "@repo/core/apiFetch";
import type { Finish, Lang } from "@/data/catalog";

/** Une ligne de possession : exemplaires d'une carte dans une finition et une langue. */
export interface OwnedLine {
  scryfallId: string;
  finish: Finish;
  lang: Lang;
  quantity: number;
}

/** Résumé par carte, pour les badges de la grille et le dialog. */
export interface CardSummary {
  total: number;
  foil: boolean;
  langs: Lang[];
  lines: OwnedLine[];
}

const lineKey = (id: string, finish: Finish, lang: Lang) => `${id}|${finish}|${lang}`;

/**
 * Collection de l'utilisateur, avec mises à jour optimistes.
 *
 * Chaque changement envoie la quantité finale (PUT). Les requêtes d'une même
 * ligne sont chaînées : plusieurs clics rapides arrivent au serveur dans
 * l'ordre, la dernière valeur l'emporte toujours.
 */
export function useCollection(initial: OwnedLine[]) {
  const [lines, setLines] = useState<Map<string, OwnedLine>>(
    () => new Map(initial.map((l) => [lineKey(l.scryfallId, l.finish, l.lang), l])),
  );
  const queues = useRef(new Map<string, Promise<unknown>>());

  const setQuantity = useCallback((scryfallId: string, finish: Finish, lang: Lang, quantity: number) => {
    const key = lineKey(scryfallId, finish, lang);
    quantity = Math.max(0, quantity);
    setLines((prev) => {
      const next = new Map(prev);
      if (quantity === 0) next.delete(key);
      else next.set(key, { scryfallId, finish, lang, quantity });
      return next;
    });

    const body = JSON.stringify({ scryfallId, finish, lang, quantity });
    const previous = queues.current.get(key) ?? Promise.resolve();
    // apiFetch affiche déjà le toast d'erreur : la chaîne ne rejette jamais.
    const request = previous
      .then(() => apiFetch("/api/cards", { method: "PUT", headers: { "Content-Type": "application/json" }, body }))
      .catch(() => {});
    queues.current.set(key, request);
  }, []);

  /** Quantité actuelle d'une ligne (0 si absente). */
  const quantityOf = useCallback(
    (scryfallId: string, finish: Finish, lang: Lang) => lines.get(lineKey(scryfallId, finish, lang))?.quantity ?? 0,
    [lines],
  );

  const byCard = useMemo(() => {
    const map = new Map<string, CardSummary>();
    for (const line of lines.values()) {
      let s = map.get(line.scryfallId);
      if (!s) map.set(line.scryfallId, (s = { total: 0, foil: false, langs: [], lines: [] }));
      s.total += line.quantity;
      s.foil ||= line.finish !== "nonfoil";
      if (!s.langs.includes(line.lang)) s.langs.push(line.lang);
      s.lines.push(line);
    }
    return map;
  }, [lines]);

  return { lines, byCard, setQuantity, quantityOf };
}
