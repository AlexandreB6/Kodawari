import { redirect } from "next/navigation";
import { LoginForm } from "@repo/ui/LoginForm";
import { isGoogleEnabled } from "@repo/auth/server";
import { currentUser } from "@/lib/scope";

export const metadata = { title: "Connexion — Manga" };

interface Props {
  searchParams: Promise<{ mode?: string }>;
}

export default async function LoginPage({ searchParams }: Props) {
  const user = await currentUser();
  if (user && !user.isAnonymous) redirect("/");
  const { mode } = await searchParams;

  return (
    <LoginForm
      googleEnabled={isGoogleEnabled}
      isGuest={!!user?.isAnonymous}
      initialMode={mode === "signup" ? "signup" : "signin"}
    />
  );
}
