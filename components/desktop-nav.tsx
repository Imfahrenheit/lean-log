"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface NavLinkProps {
  href: string;
  children: React.ReactNode;
}

function NavLink({ href, children }: NavLinkProps) {
  const pathname = usePathname();
  const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
  
  return (
    <Link 
      href={href} 
      className={cn(
        "text-sm transition-colors",
        isActive 
          ? "text-foreground font-medium" 
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      {children}
    </Link>
  );
}

interface DesktopNavProps {
  isAdmin: boolean;
}

export function DesktopNav({ isAdmin }: DesktopNavProps) {
  return (
    <nav className="hidden md:flex items-center gap-4 text-sm">
      <NavLink href="/">Today</NavLink>
      <NavLink href="/weight">Weight</NavLink>
      <NavLink href="/history">History</NavLink>
      <NavLink href="/profile">Profile</NavLink>
      <NavLink href="/settings/meals">Meals</NavLink>
      <NavLink href="/settings/api-keys">API Keys</NavLink>
      {isAdmin && <NavLink href="/settings/invites">Invites</NavLink>}
    </nav>
  );
}

