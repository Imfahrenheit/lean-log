import { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Toaster } from "@/components/ui/sonner";
import { UserMenu } from "@/components/user-menu";
import { getCurrentUserAdminStatus } from "@/lib/auth/admin";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/signin");
  }

  const isAdmin = await getCurrentUserAdminStatus();

  console.log("[AppLayout] Rendering with user:", user.email);

  return (
    <div className="min-h-screen flex flex-col">
        <header className="sticky top-0 z-50 w-full border-b bg-white dark:bg-black shadow-sm">
        <div className="container flex h-14 max-w-screen-2xl items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2">
              <h1 className="text-lg font-semibold">Lean Log</h1>
            </Link>
            <nav className="hidden md:flex items-center gap-4 text-sm">
              <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
                Today
              </Link>
              <Link href="/weight" className="text-muted-foreground hover:text-foreground transition-colors">
                Weight
              </Link>
              <Link href="/history" className="text-muted-foreground hover:text-foreground transition-colors">
                History
              </Link>
              <Link href="/profile" className="text-muted-foreground hover:text-foreground transition-colors">
                Profile
              </Link>
              <Link href="/settings/meals" className="text-muted-foreground hover:text-foreground transition-colors">
                Meals
              </Link>
              <Link href="/settings/api-keys" className="text-muted-foreground hover:text-foreground transition-colors">
                API Keys
              </Link>
              {isAdmin && (
                <Link href="/settings/invites" className="text-muted-foreground hover:text-foreground transition-colors">
                  Invites
                </Link>
              )}
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
