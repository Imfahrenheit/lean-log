import { authenticateMcpRequest } from "@/lib/mcp/auth";


export async function GET(request: Request) {
  try {
    await authenticateMcpRequest(request);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unauthorized";
    return new Response(message, { status: 401 });
  }
  return new Response("MCP SSE endpoint not implemented", { status: 501 });
}


