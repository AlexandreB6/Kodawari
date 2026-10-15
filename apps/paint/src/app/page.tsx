import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PAINT_RANGES } from "@/data/paint-ranges";
import { demoFilter, dedupBySid } from "@repo/core/demo";

export const dynamic = "force-dynamic";

/** Page hub Peinture — liste les gammes disponibles avec compteurs de possession. */
export default async function PeinturePage() {
  const where = await demoFilter();
  // groupBy can't express "dedupe seed/visitor collisions first", so we fetch
  // the raw rows and count per range in JS after dedup. Scale is tiny (dozens).
  const rawRows = await prisma.ownedPaint.findMany({
    where,
    select: { paintId: true, range: true, demoSessionId: true },
  });
  const deduped = dedupBySid(rawRows, (p) => `${p.range}:${p.paintId}`);
  const countMap = new Map<string, number>();
  for (const p of deduped) {
    countMap.set(p.range, (countMap.get(p.range) ?? 0) + 1);
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-extrabold tracking-tight">Peinture</h1>
        <p className="text-muted-foreground mt-2 text-lg">
          Choisissez une gamme de peinture
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {PAINT_RANGES.map((range) => {
          const ownedCount = countMap.get(range.slug) ?? 0;
          const totalCount = range.paints.length;
          // Pick ~8 representative swatches spread across the catalog
          const swatchCount = 8;
          const step = Math.max(1, Math.floor(range.paints.length / swatchCount));
          const swatches = Array.from(
            { length: Math.min(swatchCount, range.paints.length) },
            (_, i) => range.paints[i * step],
          );

          return (
            <Link
              key={range.slug}
              href={`/peinture/${range.slug}`}
              className="group rounded-xl border border-border/50 bg-card p-6 transition-all hover:border-border hover:shadow-lg"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-2xl font-bold group-hover:text-primary transition-colors">
                    {range.name}
                  </h2>
                  <p className="text-sm text-muted-foreground">{range.brand}</p>
                </div>
                <span className="rounded-full bg-muted px-3 py-1 text-sm font-medium">
                  {ownedCount} / {totalCount}
                </span>
              </div>

              {range.description && (
                <p className="mt-3 text-sm text-muted-foreground">
                  {range.description}
                </p>
              )}

              {/* Color swatches */}
              <div className="mt-4 flex gap-1.5">
                {swatches.map((paint) => (
                  <div
                    key={paint.id}
                    className="h-6 w-6 rounded-full border border-white/10"
                    style={{ backgroundColor: paint.hex }}
                    title={paint.name}
                  />
                ))}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
