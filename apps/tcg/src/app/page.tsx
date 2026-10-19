import { CatalogClient } from "@/components/CatalogClient";
import { loadOwned } from "@/lib/owned";

export const dynamic = "force-dynamic";

/** Catalogue complet des cartes Final Fantasy, avec la collection de l'utilisateur. */
export default async function CataloguePage() {
  return <CatalogClient mode="catalog" initialOwned={await loadOwned()} />;
}
