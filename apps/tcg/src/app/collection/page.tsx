import { CatalogClient } from "@/components/CatalogClient";
import { loadOwned } from "@/lib/owned";
import { getPriceGuide } from "@/lib/prices";

export const dynamic = "force-dynamic";
export const metadata = { title: "Ma collection — TCG" };

/** Cartes possédées : même client que le catalogue, filtré, avec statistiques et valeur. */
export default async function CollectionPage() {
  const [owned, guide] = await Promise.all([loadOwned(), getPriceGuide()]);
  return <CatalogClient mode="collection" initialOwned={owned} guide={guide} />;
}
