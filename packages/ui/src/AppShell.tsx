import { Suspense, type ReactNode } from "react";
import Link from "next/link";
import { Toaster } from "sonner";
import { BottomNav, type NavItem } from "./BottomNav";
import { PwaRegister } from "./PwaRegister";
import { AppSwitcher, type AppId } from "./AppSwitcher";
import { InstallPrompt } from "./InstallPrompt";
import { AccountMenu, type AccountUser } from "./AccountMenu";

export interface AppShellProps {
  /** Nom affiché dans le header (ex: "Cinéma"). */
  appName: string;
  /** App courante, surlignée dans le sélecteur d'apps. */
  current: AppId;
  /** Icône du header, déjà rendue (les composants ne traversent pas la frontière RSC). */
  icon: ReactNode;
  /** Utilisateur courant (compte ou invité), null sans session. */
  user: AccountUser | null;
  /** Onglets de la barre mobile. Ignorée s'il y a moins de 2 entrées. */
  navItems?: NavItem[];
  children: ReactNode;
}

/**
 * Coquille commune aux 3 apps : header sticky (sélecteur d'apps, compte),
 * bandeau d'installation, conteneur principal, barre d'onglets mobile, toasts
 * et enregistrement du service worker.
 */
export function AppShell({ appName, current, icon, user, navItems, children }: AppShellProps) {
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
            <AccountMenu user={user} />
          </div>
        </div>
      </header>

      {/* Sous le header : au-dessus, il serait recouvert par l'encoche */}
      <InstallPrompt appName={appName} />

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
