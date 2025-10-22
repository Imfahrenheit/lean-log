import { authenticateMcpRequest } from "@/lib/mcp/auth";
import { z } from "zod";

const MealSchema = z.object({
  meal_type: z.enum(["breakfast", "lunch", "dinner", "snack"]),
  items: z.array(z.string().min(1)).min(1).max(8),
  calories_kcal: z.number().int().min(0).max(4000),
  time_iso: z.string().datetime().optional(),
  notes: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    await authenticateMcpRequest(request);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unauthorized";
    return new Response(msg, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  // Expect { text: string } for now (plain text from ASR). In the future, we’ll call an LLM here.
  const text = (body?.text as string | undefined)?.trim();
  if (!text) return json({ ok: false, error: "text is required" }, 400);

  // Scaffold: return 501 until wired to an LLM with structured output.
  return json({ ok: false, error: "Parser not implemented" }, 501);
}

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json" },
  });
}


