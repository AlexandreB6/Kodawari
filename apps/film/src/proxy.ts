import { createDemoProxy } from "@repo/core/proxy";

export const proxy = createDemoProxy();

// Le matcher doit rester un littéral statique : Next l'analyse à la
// compilation et refuse une valeur importée.
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|sw.js|icon-.*\.png|apple-touch-icon\.png).*)",
  ],
};
