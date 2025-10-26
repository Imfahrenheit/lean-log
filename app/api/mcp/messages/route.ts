import { authenticateMcpRequest } from "@/lib/mcp/auth";
import { z } from "zod";
import { getLatestWeightEntryForUser, createWeightEntryForUser, listRecentWeightEntriesForUser, deleteWeightEntryForUser } from "@/lib/core/weight";
import { listMealsForUser } from "@/lib/core/meals";
import { getDaySummariesForUser } from "@/lib/core/history";
import {
  getOrCreateDayLogForUser,
  addMealEntryForUser,
  listMealEntriesForDayForUser,
} from "@/lib/core/entries";

// MCP JSON-RPC types
type JsonRpcRequest = {
  jsonrpc: "2.0";
  id?: string | number;
  method: string;
  params?: Record<string, unknown>;
};

type JsonRpcResponse = {
  jsonrpc: "2.0";
  id?: string | number;
  result?: unknown;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
};

const MCP_TOOLS = [
  {
    name: "weight_get_latest",
    description: "Get the user's most recent weight entry",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "weight_create",
    description: "Create a new weight entry",
    inputSchema: {
      type: "object",
      properties: {
        entry_date: { type: "string", description: "Date in YYYY-MM-DD format" },
        weight_kg: { type: "number", description: "Weight in kilograms" },
        source: { type: "string", description: "Source of the weight entry (e.g., 'manual', 'scale')" },
      },
      required: ["entry_date", "weight_kg"],
    },
  },
  {
    name: "weight_list_recent",
    description: "List recent weight entries",
    inputSchema: {
      type: "object",
      properties: {
        limit: { type: "number", description: "Number of entries to return (default: 50, max: 200)" },
      },
      required: [],
    },
  },
  {
    name: "weight_delete",
    description: "Delete a weight entry by ID",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string", description: "UUID of the weight entry to delete" },
      },
      required: ["id"],
    },
  },
  {
    name: "meals_list",
    description: "List the user's meal templates",
    inputSchema: {
      type: "object",
      properties: {
        includeArchived: { type: "boolean", description: "Include archived meals" },
      },
      required: [],
    },
  },
  {
    name: "history_day_summaries",
    description: "Get daily nutrition summaries for a date range",
    inputSchema: {
      type: "object",
      properties: {
        startDate: { type: "string", description: "Start date in YYYY-MM-DD format" },
        endDate: { type: "string", description: "End date in YYYY-MM-DD format" },
      },
      required: ["startDate", "endDate"],
    },
  },
  {
    name: "entries_get_or_create_day_log",
    description: "Get or create a day log for a specific date",
    inputSchema: {
      type: "object",
      properties: {
        date: { type: "string", description: "Date in YYYY-MM-DD format" },
      },
      required: ["date"],
    },
  },
  {
    name: "entries_add",
    description: "Add a new meal entry to a day log",
    inputSchema: {
      type: "object",
      properties: {
        day_log_id: { type: "string", description: "UUID of the day log" },
        meal_id: { type: "string", description: "UUID of the meal template (optional)" },
        name: { type: "string", description: "Name of the food item" },
        protein_g: { type: "number", description: "Protein in grams" },
        carbs_g: { type: "number", description: "Carbohydrates in grams" },
        fat_g: { type: "number", description: "Fat in grams" },
        calories_override: { type: "number", description: "Manual calorie override (optional)" },
      },
      required: ["day_log_id", "name", "protein_g", "carbs_g", "fat_g"],
    },
  },
  {
    name: "entries_list_by_day",
    description: "List all meal entries for a specific day log",
    inputSchema: {
      type: "object",
      properties: {
        day_log_id: { type: "string", description: "UUID of the day log" },
      },
      required: ["day_log_id"],
    },
  },
];

async function handleToolCall(userId: string, toolName: string, args: Record<string, unknown>) {
  switch (toolName) {
    case "weight_get_latest": {
      const latest = await getLatestWeightEntryForUser(userId);
      return { content: [{ type: "text", text: JSON.stringify(latest, null, 2) }] };
    }

    case "weight_create": {
      const schema = z.object({
        entry_date: z.string().min(1),
        weight_kg: z.number().min(1),
        source: z.string().nullable().optional(),
      });
      const input = schema.parse(args);
      const created = await createWeightEntryForUser({
        userId,
        entry_date: input.entry_date,
        weight_kg: input.weight_kg,
        source: input.source ?? null,
      });
      return { content: [{ type: "text", text: JSON.stringify(created, null, 2) }] };
    }

    case "weight_list_recent": {
      const params = z.object({ limit: z.number().int().min(1).max(200).optional() }).parse(args);
      const items = await listRecentWeightEntriesForUser(userId, params.limit ?? 50);
      return { content: [{ type: "text", text: JSON.stringify(items, null, 2) }] };
    }

    case "weight_delete": {
      const params = z.object({ id: z.string().uuid() }).parse(args);
      await deleteWeightEntryForUser(userId, params.id);
      return { content: [{ type: "text", text: "Weight entry deleted successfully" }] };
    }

    case "meals_list": {
      const params = z.object({ includeArchived: z.boolean().optional() }).parse(args);
      const meals = await listMealsForUser(userId, { includeArchived: params.includeArchived });
      return { content: [{ type: "text", text: JSON.stringify(meals, null, 2) }] };
    }

    case "history_day_summaries": {
      const params = z.object({ startDate: z.string().min(1), endDate: z.string().min(1) }).parse(args);
      const data = await getDaySummariesForUser(userId, params.startDate, params.endDate);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }

    case "entries_get_or_create_day_log": {
      const params = z.object({ date: z.string().min(1) }).parse(args);
      const log = await getOrCreateDayLogForUser(userId, params.date);
      return { content: [{ type: "text", text: JSON.stringify(log, null, 2) }] };
    }

    case "entries_add": {
      const params = z.object({
        day_log_id: z.string().uuid(),
        meal_id: z.string().uuid().nullable().optional(),
        name: z.string().min(1),
        protein_g: z.number().min(0),
        carbs_g: z.number().min(0),
        fat_g: z.number().min(0),
        calories_override: z.number().nullable().optional(),
      }).parse(args);
      const entry = await addMealEntryForUser(userId, params);
      return { content: [{ type: "text", text: JSON.stringify(entry, null, 2) }] };
    }

    case "entries_list_by_day": {
      const params = z.object({ day_log_id: z.string().uuid() }).parse(args);
      const items = await listMealEntriesForDayForUser(userId, params.day_log_id);
      return { content: [{ type: "text", text: JSON.stringify(items, null, 2) }] };
    }

    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
}

export async function POST(request: Request) {
  try {
    const auth = await authenticateMcpRequest(request);
    const body = await request.json().catch(() => ({})) as JsonRpcRequest;
    const method = body?.method;
    const id = body?.id;

    // MCP Protocol: Initialize
    if (method === "initialize") {
      return jsonRpcResponse({
        protocolVersion: "2024-11-05",
        capabilities: {
          tools: {},
        },
        serverInfo: {
          name: "lean-log",
          version: "1.0.0",
        },
      }, id);
    }

    // MCP Protocol: List tools
    if (method === "tools/list") {
      return jsonRpcResponse({ tools: MCP_TOOLS }, id);
    }

    // MCP Protocol: Call tool
    if (method === "tools/call") {
      const toolName = body?.params?.name as string;
      const args = (body?.params?.arguments ?? {}) as Record<string, unknown>;
      
      if (!toolName) {
        return jsonRpcError(-32602, "Invalid params: missing tool name", id);
      }

      const result = await handleToolCall(auth.userId, toolName, args);
      return jsonRpcResponse(result, id);
    }

    return jsonRpcError(-32601, `Method not found: ${method}`, id);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal error";
    return jsonRpcError(-32603, message, undefined);
  }
}

function jsonRpcResponse(result: unknown, id?: string | number): Response {
  const response: JsonRpcResponse = {
    jsonrpc: "2.0",
    id,
    result,
  };
  return new Response(JSON.stringify(response), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

function jsonRpcError(code: number, message: string, id?: string | number, data?: unknown): Response {
  const response: JsonRpcResponse = {
    jsonrpc: "2.0",
    id,
    error: { code, message, data },
  };
  return new Response(JSON.stringify(response), {
    status: 200, // JSON-RPC errors still return 200
    headers: { "content-type": "application/json" },
  });
}
