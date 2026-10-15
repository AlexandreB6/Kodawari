import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { RANGE_MAP } from "@/data/paint-ranges";
import { PeintureClient } from "@/components/PeintureClient";
import { demoFilter, dedupBySid } from "@repo/core/demo";

interface Props {
  params: Promise<{ range: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { range: rangeSlug } = await params;
  const range = RANGE_MAP.get(rangeSlug);
  if (!range) return {};
  return {
    title: `${range.name} — Peinture`,
    description: range.description,
  };
}

/** Page d'une gamme de peinture — charge les possessions depuis la DB et passe au client. */
export default async function PeintureRangePage({ params }: Props) {
  const { range: rangeSlug } = await params;
  const range = RANGE_MAP.get(rangeSlug);
  if (!range) notFound();

  const filter = await demoFilter();
  const ownedPaintsRaw = await prisma.ownedPaint.findMany({
    where: { AND: [{ range: rangeSlug }, filter] },
  });
  const ownedPaints = dedupBySid(ownedPaintsRaw, (p) => p.paintId);

  const owned = ownedPaints.map((p) => ({
    paintId: p.paintId,
    quantity: p.quantity,
    notes: p.notes,
    demoSessionId: p.demoSessionId,
  }));

  return (
    <PeintureClient
      initialOwned={owned}
      paints={range.paints}
      paintTypes={range.paintTypes}
      typeColors={range.typeColors}
      rangeSlug={range.slug}
      rangeName={range.name}
    />
  );
}
