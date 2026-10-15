import { WifiOff } from "lucide-react";

export const metadata = { title: "Hors ligne — Cinéma" };

/** Page servie par le service worker quand le réseau est indisponible. */
export default function OfflinePage() {
  return (
    <div className="max-w-sm mx-auto mt-24 text-center space-y-3">
      <WifiOff className="w-10 h-10 mx-auto text-muted-foreground" aria-hidden="true" />
      <h1 className="text-2xl font-bold tracking-tight">Hors ligne</h1>
      <p className="text-muted-foreground text-sm">
        Cette page a besoin du réseau. Reconnectez-vous puis réessayez.
      </p>
    </div>
  );
}
