import { createSupabaseServerClient } from "@/lib/supabase/server";
import { groqClient } from "@/lib/groq-client";
import {
  ParsedMealSchema,
  GROQ_MEAL_PARSING_JSON_SCHEMA,
} from "@/lib/voice-schemas";
import {
  MEAL_PARSING_SYSTEM_PROMPT,
  MEAL_PARSING_USER_PROMPT_TEMPLATE,
} from "@/lib/voice-prompts";

export async function POST(request: Request) {
  // Use session authentication instead of MCP API keys
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const text = (body?.text as string | undefined)?.trim();

  if (!text) {
    return json({ ok: false, error: "text is required" }, 400);
  }

  try {
    const completion = await groqClient.chat.completions.create({
      model: "openai/gpt-oss-20b", // Production model, supports json_schema, 13x cheaper than Kimi
      messages: [
        {
          role: "system",
          content: MEAL_PARSING_SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: MEAL_PARSING_USER_PROMPT_TEMPLATE(text),
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: GROQ_MEAL_PARSING_JSON_SCHEMA,
      },
      temperature: 0.3,
    });

    const parsed = JSON.parse(completion.choices[0].message.content || "{}");
    const validated = ParsedMealSchema.parse(parsed);

    return json({ ok: true, data: validated });
  } catch (error) {
    console.error("Parse error:", error);
    return json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Failed to parse meal data",
      },
      500
    );
  }
}

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json" },
  });
}
