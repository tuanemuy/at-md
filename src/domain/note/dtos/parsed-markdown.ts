import { z } from "zod";
import { noteScopeSchema } from "../models/note";

export const parsedMarkdownSchema = z.object({
  title: z.string().nullable(),
  body: z.string(),
  tags: z.array(z.string().nonempty()).default([]),
  scope: noteScopeSchema,
});
export type ParsedMarkdown = z.infer<typeof parsedMarkdownSchema>;
