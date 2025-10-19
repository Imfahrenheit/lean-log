import { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Toaster } from "@/components/ui/sonner";
import { UserMenu } from "@/components/user-menu";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/signin");
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 max-w-screen-2xl items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2">
              <h1 className="text-lg font-semibold">Lean Log</h1>
            </Link>
            <nav className="hidden md:flex items-center gap-4 text-sm">
              <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
                Today
              </Link>
              <Link href="/profile" className="text-muted-foreground hover:text-foreground transition-colors">
                Profile
              </Link>
              <Link href="/settings/meals" className="text-muted-foreground hover:text-foreground transition-colors">
                Meals
              </Link>
            </nav>
          </div>
          <UserMenu userEmail={user.email ?? "User"} />
        </div>
      </header>
      <main className="flex-1">
        {children}
      </main>
      <Toaster richColors />
    </div>
  );
}
