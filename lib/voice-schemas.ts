import { z } from "zod";

export const MealEntrySchema = z.object({
  name: z.string().describe("Name of the food item"),
  protein_g: z.number().min(0).describe("Protein in grams"),
  carbs_g: z.number().min(0).describe("Carbohydrates in grams"),
  fat_g: z.number().min(0).describe("Fat in grams"),
  calories_override: z
    .number()
    .nullable()
    .optional()
    .describe("Override calculated calories if explicitly mentioned"),
  meal_type: z
    .string()
    .nullable()
    .optional()
    .describe("Type of meal - can be breakfast/lunch/dinner/snack OR custom like meal-1, meal-2"),
  confidence: z
    .number()
    .min(0)
    .max(1)
    .describe("Confidence score of the parse (0-1)"),
});

export const ParsedMealSchema = z.object({
  entries: z.array(MealEntrySchema).min(1).max(10),
  notes: z.string().nullable().optional(),
});

export type MealEntry = z.infer<typeof MealEntrySchema>;
export type ParsedMeal = z.infer<typeof ParsedMealSchema>;

/**
 * JSON Schema for Groq's structured output format
 * Note: Groq's strict mode requires ALL properties to be required
 * We use nullable types instead of optional for fields that might be empty
 */
export const GROQ_MEAL_PARSING_JSON_SCHEMA = {
  name: "meal_entries",
  strict: true,
  schema: {
    type: "object",
    properties: {
      entries: {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: { type: "string" },
            protein_g: { type: "number" },
            carbs_g: { type: "number" },
            fat_g: { type: "number" },
            calories_override: { type: ["number", "null"] },
            meal_type: {
              type: ["string", "null"],
              description: "Meal type - common: breakfast/lunch/dinner/snack, custom: meal-1/meal-2/etc",
            },
            confidence: { type: "number" },
          },
          required: [
            "name",
            "protein_g",
            "carbs_g",
            "fat_g",
            "calories_override",
            "meal_type",
            "confidence",
          ],
          additionalProperties: false,
        },
      },
      notes: { type: ["string", "null"] },
    },
    required: ["entries", "notes"],
    additionalProperties: false,
  },
} as const;
