import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Film, Compass } from "lucide-react";
import { AppShell } from "@repo/ui/AppShell";
import type { NavItem } from "@repo/ui/BottomNav";

/** Police principale — Plus Jakarta Sans via Google Fonts */
const jakarta = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Cinéma",
  description: "Ma collection de films et mes découvertes TMDB",
  applicationName: "Cinéma",
  appleWebApp: { capable: true, title: "Cinéma", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  viewportFit: "cover",
};

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Explorer", icon: <Compass className="h-5 w-5 md:h-3.5 md:w-3.5" aria-hidden="true" /> },
  { href: "/?tab=collection", label: "Ma collection", icon: <Film className="h-5 w-5 md:h-3.5 md:w-3.5" aria-hidden="true" /> },
];

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" className="dark">
      <body className={`${jakarta.variable} font-sans antialiased min-h-screen bg-background text-foreground`}>
        <AppShell
          appName="Cinéma"
          icon={<Film className="w-5 h-5 text-blue-400" aria-hidden="true" />}
          navItems={NAV_ITEMS}
        >
          {children}
        </AppShell>
      </body>
    </html>
  );
}
