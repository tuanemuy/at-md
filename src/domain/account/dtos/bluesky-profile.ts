import { z } from "zod";

export const blueskyProfileSchema = z.object({
  did: z.string(),
  handle: z.string(),
  displayName: z.string().max(640).nullish(),
  description: z.string().max(2560).nullish(),
  avatar: z.string().url().nullish(),
  banner: z.string().url().nullish(),
});

export type BlueskyProfile = z.infer<typeof blueskyProfileSchema>;
