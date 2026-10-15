import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Paintbrush } from "lucide-react";
import { AppShell } from "@repo/ui/AppShell";
import type { NavItem } from "@repo/ui/BottomNav";
import { PAINT_RANGES } from "@/data/paint-ranges";

/** Police principale — Plus Jakarta Sans via Google Fonts */
const jakarta = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Peinture",
  description: "Inventaire de peintures pour figurines",
  applicationName: "Peinture",
  appleWebApp: { capable: true, title: "Peinture", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  viewportFit: "cover",
};

// Accueil + un onglet par gamme : le catalogue est statique, la liste l'est aussi.
const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Gammes", icon: <Paintbrush className="h-5 w-5 md:h-3.5 md:w-3.5" aria-hidden="true" /> },
  ...PAINT_RANGES.map((range) => ({
    href: `/peinture/${range.slug}`,
    label: range.name,
    icon: (
      <span
        className="h-5 w-5 md:h-3.5 md:w-3.5 rounded-full border border-white/20"
        style={{ backgroundColor: range.paints[0]?.hex ?? "#888" }}
        aria-hidden="true"
      />
    ),
  })),
];

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" className="dark">
      <body className={`${jakarta.variable} font-sans antialiased min-h-screen bg-background text-foreground`}>
        <AppShell
          appName="Peinture"
          icon={<Paintbrush className="w-5 h-5 text-amber-400" aria-hidden="true" />}
          navItems={NAV_ITEMS}
        >
          {children}
        </AppShell>
      </body>
    </html>
  );
}
