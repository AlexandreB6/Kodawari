import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Layers, Library } from "lucide-react";
import { AppShell } from "@repo/ui/AppShell";
import { currentAccount } from "@/lib/scope";
import type { NavItem } from "@repo/ui/BottomNav";

/** Police principale — Plus Jakarta Sans via Google Fonts */
const jakarta = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "TCG",
  description: "Collection Magic: The Gathering — Final Fantasy",
  applicationName: "TCG",
  appleWebApp: { capable: true, title: "TCG", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  viewportFit: "cover",
};

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Catalogue", icon: <Layers className="h-5 w-5 md:h-3.5 md:w-3.5" aria-hidden="true" /> },
  { href: "/collection", label: "Collection", icon: <Library className="h-5 w-5 md:h-3.5 md:w-3.5" aria-hidden="true" /> },
];

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await currentAccount();
  return (
    <html lang="fr" className="dark">
      <body className={`${jakarta.variable} font-sans antialiased min-h-screen bg-background text-foreground`}>
        <AppShell
          appName="TCG"
          current="tcg"
          user={user}
          icon={<Layers className="w-5 h-5 text-rose-400" aria-hidden="true" />}
          navItems={NAV_ITEMS}
        >
          {children}
        </AppShell>
      </body>
    </html>
  );
}
