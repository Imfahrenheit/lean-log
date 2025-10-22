import { authenticateMcpRequest } from "@/lib/mcp/auth";

export async function POST(request: Request) {
  try {
    await authenticateMcpRequest(request);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unauthorized";
    return new Response(message, { status: 401 });
  }
  return new Response(JSON.stringify({ error: "MCP messages endpoint not implemented" }), {
    status: 501,
    headers: { "content-type": "application/json" },
  });
}


