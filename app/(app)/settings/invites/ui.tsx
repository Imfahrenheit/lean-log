"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { generateInvite, revokeInvite, type InvitePublic } from "./actions";
import { toast } from "sonner";

export function InvitesClient({ initialInvites }: { initialInvites: InvitePublic[] }) {
  const [invites, setInvites] = useState<InvitePublic[]>(initialInvites);
  const [email, setEmail] = useState<string>("");
  const [expiresInDays, setExpiresInDays] = useState<string>("");
  const [isPending, startTransition] = useTransition();

  function onCreate() {
    if (!email.trim()) {
      toast.error("Email is required");
      return;
    }

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }

    const days = expiresInDays.trim() ? parseInt(expiresInDays.trim(), 10) : undefined;
    
    if (expiresInDays.trim() && (isNaN(days!) || days! <= 0)) {
      toast.error("Expiration days must be a positive number");
      return;
    }

    startTransition(async () => {
      try {
        const newInvite = await generateInvite(trimmedEmail, days);
        setInvites((prev) => [newInvite, ...prev]);
        setEmail("");
        setExpiresInDays("");
        toast.success(`Invite created for ${newInvite.email}`);
      } catch (e) {
        toast.error((e as Error).message);
      }
    });
  }

  function onRevoke(id: string) {
    startTransition(async () => {
      try {
        await revokeInvite(id);
        setInvites((prev) => 
          prev.map((inv) => 
            inv.id === id 
              ? { ...inv, revoked_at: new Date().toISOString() } 
              : inv
          )
        );
        toast.success("Invite revoked");
      } catch (e) {
        toast.error((e as Error).message);
      }
    });
  }

  function copyEmail(email: string) {
    navigator.clipboard.writeText(email).then(() => {
      toast.success("Email copied to clipboard");
    });
  }

  function getInviteStatus(invite: InvitePublic): { label: string; className: string } {
    if (invite.revoked_at) {
      return { label: "Revoked", className: "text-red-600" };
    }
    if (invite.used_at) {
      return { label: "Used", className: "text-gray-600" };
    }
    if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
      return { label: "Expired", className: "text-orange-600" };
    }
    return { label: "Active", className: "text-green-600" };
  }

  const stats = {
    total: invites.length,
    active: invites.filter((inv) => !inv.used_at && !inv.revoked_at && (!inv.expires_at || new Date(inv.expires_at) > new Date())).length,
    used: invites.filter((inv) => inv.used_at).length,
    revoked: invites.filter((inv) => inv.revoked_at).length,
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="rounded-md border p-3">
          <div className="text-2xl font-bold">{stats.total}</div>
          <div className="text-xs text-muted-foreground">Total</div>
        </div>
        <div className="rounded-md border p-3">
          <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          <div className="text-xs text-muted-foreground">Active</div>
        </div>
        <div className="rounded-md border p-3">
          <div className="text-2xl font-bold text-gray-600">{stats.used}</div>
          <div className="text-xs text-muted-foreground">Used</div>
        </div>
        <div className="rounded-md border p-3">
          <div className="text-2xl font-bold text-red-600">{stats.revoked}</div>
          <div className="text-xs text-muted-foreground">Revoked</div>
        </div>
      </div>

      <Separator />

      {/* Generate new invite */}
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium mb-1">Email address</label>
          <Input
            type="email"
            placeholder="user@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">Expires in (days, optional)</label>
            <Input
              type="number"
              placeholder="Leave blank for no expiration"
              value={expiresInDays}
              onChange={(e) => setExpiresInDays(e.target.value)}
              min="1"
            />
          </div>
          <Button onClick={onCreate} disabled={isPending || !email.trim()}>Create Invite</Button>
        </div>
      </div>

      <Separator />

      {/* Invites list */}
      <div className="space-y-2">
        {invites.length === 0 ? (
          <div className="text-sm text-muted-foreground">No invites yet.</div>
        ) : (
          <ul className="space-y-2">
            {invites.map((inv) => {
              const status = getInviteStatus(inv);
              return (
                <li key={inv.id} className="flex items-center justify-between rounded-md border p-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="text-sm font-medium">{inv.email}</div>
                      <span className={`text-xs font-medium ${status.className}`}>
                        {status.label}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Created {new Date(inv.created_at).toLocaleString()}
                      {inv.used_at && ` • Used ${new Date(inv.used_at).toLocaleString()}`}
                      {inv.expires_at && ` • Expires ${new Date(inv.expires_at).toLocaleString()}`}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyEmail(inv.email)}
                    >
                      Copy Email
                    </Button>
                    {!inv.revoked_at && !inv.used_at && (
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => onRevoke(inv.id)}
                        disabled={isPending}
                      >
                        Revoke
                      </Button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

