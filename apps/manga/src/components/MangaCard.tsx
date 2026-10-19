"use client";

import { useState } from "react";
import Link from "next/link";
import { Star, BookOpen, Trash2 } from "lucide-react";
import { mangaSlugify } from "@/lib/jikan";
import { ConfirmDialog } from "@repo/ui/ConfirmDialog";

/** Manga tel que stocké en DB, avec dates sérialisées en ISO string */
export interface MangaItem {
  id: number;
  malId: number;
  title: string;
  titleJapanese: string | null;
  coverImage: string | null;
  author: string | null;
  volumes: number | null;
  chapters: number | null;
  synopsis: string | null;
  genres: string | null;
  demographic: string | null;
  score: number | null;
  status: string | null;
  ownedVolumesMap: number[];
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

interface MangaCardProps {
  manga: MangaItem;
  onRemove: () => void;
}

/** Carte d'un manga dans la collection — couverture, infos, progression. */
export function MangaCard({ manga, onRemove }: MangaCardProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const statusLabel = manga.status === "Finished" ? "Terminé" : manga.status === "Publishing" ? "En cours" : manga.status;
  const ownedCount = manga.ownedVolumesMap.length;
  const slug = mangaSlugify(manga.title, manga.malId);

  return (
    <>
    <Link
      href={`/manga/${slug}`}
      className="group relative flex flex-col rounded-xl border border-border/50 bg-card overflow-hidden transition-all hover:border-border hover:shadow-lg"
    >
      {/* Couverture */}
      <div className="relative aspect-[2/3] bg-muted overflow-hidden">
        {manga.coverImage ? (
          <img
            src={manga.coverImage}
            alt={`Couverture de ${manga.title}`}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <BookOpen className="h-8 w-8 text-muted-foreground/50" aria-hidden="true" />
          </div>
        )}
        {/* Badge statut */}
        {statusLabel && (
          <span className={`absolute top-2 left-2 rounded-full px-2 py-0.5 text-[10px] font-semibold bg-black/60 backdrop-blur-sm ${
            manga.status === "Finished"
              ? "text-emerald-300"
              : "text-amber-300"
          }`}>
            {statusLabel}
          </span>
        )}
        {/* Score MAL */}
        {manga.score != null && manga.score > 0 && (
          <span className="absolute top-2 right-2 flex items-center gap-0.5 rounded-full bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold text-amber-300">
            <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" aria-hidden="true" />
            {manga.score.toFixed(1)}
          </span>
        )}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setConfirmOpen(true);
          }}
          aria-label={`Supprimer ${manga.title}`}
          className="absolute bottom-2 right-2 flex h-7 w-7 items-center justify-center rounded-md bg-black/80 text-white opacity-0 group-hover:opacity-100 hover:bg-destructive/80 hover:text-white transition-all cursor-pointer"
        >
          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
        {/* Barre de progression */}
        {manga.volumes != null && manga.volumes > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/40">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${Math.min(100, (ownedCount / manga.volumes) * 100)}%` }}
            />
          </div>
        )}
      </div>

      {/* Infos */}
      <div className="flex flex-1 flex-col p-3">
        <p className="text-sm font-medium leading-tight truncate" title={manga.title}>
          {manga.title}
        </p>
        {manga.author && (
          <p className="mt-0.5 text-xs text-muted-foreground truncate">{manga.author}</p>
        )}
        {manga.demographic && (
          <span className="mt-1 inline-block rounded-full bg-violet-500/15 px-2 py-0.5 text-[10px] font-medium text-violet-400 w-fit">
            {manga.demographic}
          </span>
        )}

        {/* Compteur de volumes */}
        <div className="mt-auto pt-2">
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">{ownedCount}</span>
            {manga.volumes != null ? (
              <span> / {manga.volumes} volumes</span>
            ) : (
              <span> volume{ownedCount !== 1 ? "s" : ""}</span>
            )}
          </p>
        </div>
      </div>
    </Link>

      <ConfirmDialog
        open={confirmOpen}
        title="Supprimer ce manga"
        description={`« ${manga.title} » sera retiré de ta collection. Cette action est irréversible.`}
        onConfirm={() => {
          setConfirmOpen(false);
          onRemove();
        }}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
}
