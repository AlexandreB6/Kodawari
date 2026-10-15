import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { BookOpen } from "lucide-react";
import { AppShell } from "@repo/ui/AppShell";
import { currentAccount } from "@/lib/scope";

/** Police principale — Plus Jakarta Sans via Google Fonts */
const jakarta = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Manga",
  description: "Ma collection de mangas et le suivi des volumes possédés",
  applicationName: "Manga",
  appleWebApp: { capable: true, title: "Manga", statusBarStyle: "black-translucent" },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  viewportFit: "cover",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await currentAccount();
  return (
    <html lang="fr" className="dark">
      <body className={`${jakarta.variable} font-sans antialiased min-h-screen bg-background text-foreground`}>
        {/* Une seule destination (la collection) : pas de barre d'onglets. */}
        <AppShell appName="Manga" current="manga" user={user} icon={<BookOpen className="w-5 h-5 text-violet-400" aria-hidden="true" />}>
          {children}
        </AppShell>
      </body>
    </html>
  );
}
