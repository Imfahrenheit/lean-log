import { authenticateMcpRequest } from "@/lib/mcp/auth";

export async function POST(request: Request) {
  // Auth: reuse MCP API key to bind to a user. We don't use the user yet, but this keeps parity.
  try {
    await authenticateMcpRequest(request);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unauthorized";
    return new Response(msg, { status: 401 });
  }

  // Scaffold only: if ASR provider configured, implement transcription here.
  if (!process.env.OPENAI_API_KEY) {
    return new Response("ASR not configured (set OPENAI_API_KEY)", { status: 501 });
  }

  // Placeholder: return 501 until wired to ASR service (Whisper/gpt-4o-mini-transcribe)
  return new Response("Transcription endpoint not implemented", { status: 501 });
}


