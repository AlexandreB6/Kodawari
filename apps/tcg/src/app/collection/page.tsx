import { CatalogClient } from "@/components/CatalogClient";
import { loadOwned } from "@/lib/owned";

export const dynamic = "force-dynamic";
export const metadata = { title: "Ma collection — TCG" };

/** Cartes possédées : même client que le catalogue, filtré et avec statistiques. */
export default async function CollectionPage() {
  return <CatalogClient mode="collection" initialOwned={await loadOwned()} />;
}
