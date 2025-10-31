import { listInvites } from "./actions";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { InvitesClient } from "./ui";
import { getCurrentUserAdminStatus } from "@/lib/auth/admin";

export default async function InvitesPage() {
  // Check if user is admin, redirect if not
  const isAdmin = await getCurrentUserAdminStatus();
  if (!isAdmin) {
    redirect("/");
  }

  const invites = await listInvites();
  return (
    <div className="max-w-3xl mx-auto p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Invites</h1>
        <Link href="/settings/api-keys" className="text-sm underline">Back</Link>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Manage invite codes</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Generate invite codes for new users to sign up. Invite codes are single-use and can optionally expire. Share codes securely with users you want to invite.
          </p>
          <Separator className="my-4" />
          <InvitesClient initialInvites={invites} />
        </CardContent>
      </Card>
    </div>
  );
}

