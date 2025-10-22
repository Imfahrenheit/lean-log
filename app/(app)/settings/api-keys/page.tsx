import { listApiKeys } from "./actions";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ApiKeysClient } from "./ui";

export default async function ApiKeysPage() {
  const keys = await listApiKeys();
  return (
    <div className="max-w-3xl mx-auto p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">API Keys</h1>
        <Link href="/\(app\)/settings" className="text-sm underline">Back to Settings</Link>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Manage your personal API keys</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Generate API keys to connect MCP clients (Claude Desktop, ChatGPT) to your Lean Log data. Keys are shown once; store them securely.
          </p>
          <Separator className="my-4" />
          <ApiKeysClient initialKeys={keys} />
        </CardContent>
      </Card>
    </div>
  );
}


