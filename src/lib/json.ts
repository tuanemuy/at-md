import { z } from "zod";

export const jsonPrimitiveSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.null(),
]);
export const jsonValueSchema: z.ZodType<JsonValue> = z.lazy(() =>
  z.union([
    jsonPrimitiveSchema,
    z.array(jsonValueSchema),
    z.record(jsonValueSchema),
  ]),
);
export const jsonObjectSchema: z.ZodType<JsonObject> =
  z.record(jsonValueSchema);
