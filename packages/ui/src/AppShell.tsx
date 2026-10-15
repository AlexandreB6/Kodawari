import { Suspense, type ReactNode } from "react";
import Link from "next/link";
import { LogIn, LogOut } from "lucide-react";
import { Toaster } from "sonner";
import { isOwnerGateEnabled, isOwnerAuthenticated } from "@repo/core/owner";
import { DemoBanner } from "./DemoBanner";
import { BottomNav, type NavItem } from "./BottomNav";
import { PwaRegister } from "./PwaRegister";
import { AppSwitcher, type AppId } from "./AppSwitcher";
import { InstallPrompt } from "./InstallPrompt";

export interface AppShellProps {
  /** Nom affiché dans le header (ex: "Cinéma"). */
  appName: string;
  /** App courante, surlignée dans le sélecteur d'apps. */
  current: AppId;
  /** Icône du header, déjà rendue (les composants ne traversent pas la frontière RSC). */
  icon: ReactNode;
  /** Onglets de la barre mobile. Ignorée s'il y a moins de 2 entrées. */
  navItems?: NavItem[];
  children: ReactNode;
}

const IS_DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

/**
 * Coquille commune aux 3 apps : bandeau démo, header sticky, conteneur
 * principal, barre d'onglets mobile, toasts et enregistrement du service
 * worker. Extraite de l'ancien layout.tsx monolithique.
 */
export async function AppShell({ appName, current, icon, navItems, children }: AppShellProps) {
  const showOwnerButton = isOwnerGateEnabled();
  const isOwner = showOwnerButton && (await isOwnerAuthenticated());
  const showBottomNav = (navItems?.length ?? 0) >= 2;

  return (
    <>
      {/* Skip-to-content link — visible uniquement au focus clavier */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:top-2 focus:left-2 focus:px-4 focus:py-2 focus:rounded-md focus:bg-primary focus:text-primary-foreground focus:text-sm focus:font-medium"
      >
        Aller au contenu principal
      </a>

      {/* pt-safe : passe sous l'encoche / Dynamic Island en PWA (status bar
          black-translucent + viewportFit cover). Vaut 0 sans découpe. */}
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl pt-[env(safe-area-inset-top)]">
        <div className="relative max-w-7xl mx-auto px-safe sm:[--gutter:1.5rem] py-4 flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            {icon}
            <span className="text-lg font-bold tracking-tight">{appName}</span>
          </Link>

          {/* Onglets desktop — la version mobile est la BottomNav */}
          {showBottomNav && (
            <nav className="hidden md:flex items-center gap-5 ml-8 mr-auto text-sm" aria-label="Navigation principale">
              {navItems!.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
                >
                  {item.icon}
                  {item.label}
                </Link>
              ))}
            </nav>
          )}

          <div className="ml-auto flex items-center gap-2">
            <AppSwitcher current={current} />

            {showOwnerButton &&
              (isOwner ? (
                <form action="/api/auth/logout" method="post">
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                    title="Se déconnecter"
                  >
                    <LogOut className="w-3.5 h-3.5" aria-hidden="true" />
                    <span className="hidden sm:inline">Déconnexion</span>
                  </button>
                </form>
              ) : (
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  title="Se connecter"
                >
                  <LogIn className="w-3.5 h-3.5" aria-hidden="true" />
                  <span className="hidden sm:inline">Connexion</span>
                </Link>
              ))}
          </div>
        </div>
      </header>

      {/* Sous le header : au-dessus, ils seraient recouverts par l'encoche */}
      <InstallPrompt appName={appName} />
      {IS_DEMO && <DemoBanner />}

      {/* Padding bas sur mobile : laisse la place à la BottomNav fixée */}
      <main
        id="main-content"
        className={`max-w-7xl mx-auto px-safe sm:[--gutter:1.5rem] py-8 ${
          showBottomNav
            ? "pb-[calc(6rem+env(safe-area-inset-bottom))] md:pb-8"
            : "pb-[calc(2rem+env(safe-area-inset-bottom))]"
        }`}
      >
        {children}
      </main>

      {showBottomNav && (
        <Suspense fallback={null}>
          <BottomNav items={navItems!} />
        </Suspense>
      )}

      <Toaster
        richColors
        position="bottom-right"
        theme="dark"
        mobileOffset={{
          bottom: showBottomNav
            ? "calc(env(safe-area-inset-bottom) + 4.5rem)"
            : "calc(env(safe-area-inset-bottom) + 1rem)",
        }}
      />
      <PwaRegister />
    </>
  );
}
