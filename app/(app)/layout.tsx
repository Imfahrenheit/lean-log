import { ReactNode } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Toaster } from "@/components/ui/sonner";
import { UserMenu } from "@/components/user-menu";
import { MobileNav } from "@/components/mobile-nav";
import { DesktopNav } from "@/components/desktop-nav";
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
          <div className="flex items-center gap-4">
            <MobileNav isAdmin={isAdmin} />
            <Link href="/" className="flex items-center gap-2">
              <h1 className="text-lg font-semibold">Lean Log</h1>
            </Link>
            <DesktopNav isAdmin={isAdmin} />
          </div>
          <UserMenu userEmail={user.email ?? "User"} isAdmin={isAdmin} />
        </div>
      </header>
      <main className="flex-1">
        {children}
      </main>
      <Toaster richColors />
    </div>
  );
}
