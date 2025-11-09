"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ExitIcon, PersonIcon } from "@radix-ui/react-icons";
import { Calendar, Scale, History, Utensils, Key, Mail } from "lucide-react";
import { cn } from "@/lib/utils";

interface UserMenuProps {
  userEmail: string;
  isAdmin?: boolean;
}

export function UserMenu({ userEmail, isAdmin = false }: UserMenuProps) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createSupabaseBrowserClient();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleSignOut() {
    setIsLoggingOut(true);
    try {
      await supabase.auth.signOut();
      router.push("/signin");
      router.refresh();
    } catch (error) {
      console.error("Error signing out:", error);
      setIsLoggingOut(false);
    }
  }

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(href);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <PersonIcon className="h-4 w-4" />
          <span className="hidden sm:inline text-sm">{userEmail}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">Account</p>
            <p className="text-xs leading-none text-muted-foreground truncate">
              {userEmail}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {/* Main Navigation */}
        <DropdownMenuItem 
          onClick={() => router.push("/")}
          className={cn(isActive("/") && "bg-accent")}
        >
          <Calendar className="mr-2 h-4 w-4" />
          Today
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => router.push("/weight")}
          className={cn(isActive("/weight") && "bg-accent")}
        >
          <Scale className="mr-2 h-4 w-4" />
          Weight
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => router.push("/history")}
          className={cn(isActive("/history") && "bg-accent")}
        >
          <History className="mr-2 h-4 w-4" />
          History
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => router.push("/profile")}
          className={cn(isActive("/profile") && "bg-accent")}
        >
          <PersonIcon className="mr-2 h-4 w-4" />
          Profile
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        {/* Settings */}
        <DropdownMenuItem 
          onClick={() => router.push("/settings/meals")}
          className={cn(isActive("/settings/meals") && "bg-accent")}
        >
          <Utensils className="mr-2 h-4 w-4" />
          Meals
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => router.push("/settings/api-keys")}
          className={cn(isActive("/settings/api-keys") && "bg-accent")}
        >
          <Key className="mr-2 h-4 w-4" />
          API Keys
        </DropdownMenuItem>
        
        {/* Admin Section */}
        {isAdmin && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => router.push("/settings/invites")}
              className={cn(isActive("/settings/invites") && "bg-accent")}
            >
              <Mail className="mr-2 h-4 w-4" />
              Invites
            </DropdownMenuItem>
          </>
        )}
        
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} disabled={isLoggingOut}>
          <ExitIcon className="mr-2 h-4 w-4" />
          {isLoggingOut ? "Signing out..." : "Sign out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
