"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { createApiKey, revokeApiKey, type ApiKeyPublic } from "./actions";
import { toast } from "sonner";

export function ApiKeysClient({ initialKeys }: { initialKeys: ApiKeyPublic[] }) {
  const [keys, setKeys] = useState<ApiKeyPublic[]>(initialKeys);
  const [newName, setNewName] = useState("");
  const [revealedKey, setRevealedKey] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onCreate() {
    if (!newName.trim()) {
      toast.error("Enter a name for the key");
      return;
    }
    startTransition(async () => {
      try {
        const { key, record } = await createApiKey(newName.trim());
        setKeys((prev) => [record, ...prev]);
        setRevealedKey(key);
        setNewName("");
      } catch (e) {
        toast.error((e as Error).message);
      }
    });
  }

  function onRevoke(id: string) {
    startTransition(async () => {
      try {
        await revokeApiKey(id);
        setKeys((prev) => prev.map((k) => (k.id === id ? { ...k, revoked_at: new Date().toISOString() } : k)));
        toast.success("Key revoked");
      } catch (e) {
        toast.error((e as Error).message);
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-2">
        <Input
          placeholder="Key name (e.g., My Mac, Work Laptop)"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
        />
        <Button onClick={onCreate} disabled={isPending}>Generate</Button>
      </div>

      {revealedKey && (
        <div className="rounded-md border p-3 bg-muted/30">
          <div className="text-sm font-mono break-all">{revealedKey}</div>
          <div className="text-xs text-muted-foreground mt-1">Copy and store this key now. You won&apos;t see it again.</div>
          <div className="mt-2">
            <Button
              variant="secondary"
              onClick={() => {
                navigator.clipboard.writeText(revealedKey).then(() => toast.success("Copied"));
              }}
            >Copy</Button>
          </div>
        </div>
      )}

      <Separator />

      <div className="space-y-2">
        {keys.length === 0 ? (
          <div className="text-sm text-muted-foreground">No API keys yet.</div>
        ) : (
          <ul className="space-y-2">
            {keys.map((k) => (
              <li key={k.id} className="flex items-center justify-between rounded-md border p-3">
                <div>
                  <div className="text-sm font-medium">{k.name}</div>
                  <div className="text-xs text-muted-foreground">
                    Created {new Date(k.created_at).toLocaleString()} • {k.revoked_at ? "Revoked" : "Active"}
                    {k.last_used_at ? ` • Last used ${new Date(k.last_used_at).toLocaleString()}` : ""}
                  </div>
                </div>
                <div className="flex gap-2">
                  {!k.revoked_at && (
                    <Button variant="destructive" onClick={() => onRevoke(k.id)} disabled={isPending}>Revoke</Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}


