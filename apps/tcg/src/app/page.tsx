import { CatalogClient } from "@/components/CatalogClient";
import { loadOwned } from "@/lib/owned";
import { getPriceGuide } from "@/lib/prices";

export const dynamic = "force-dynamic";

/** Catalogue complet des cartes Final Fantasy, avec la collection de l'utilisateur. */
export default async function CataloguePage() {
  const [owned, guide] = await Promise.all([loadOwned(), getPriceGuide()]);
  return <CatalogClient mode="catalog" initialOwned={owned} guide={guide} />;
}
