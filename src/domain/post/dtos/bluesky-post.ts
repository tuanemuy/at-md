/**
 * Bluesky投稿情報のDTO
 */
import { z } from "zod";

/**
 * DID型の定義
 */
export type DID = string;

/**
 * Bluesky投稿情報のZodスキーマ
 */
export const blueskyPostSchema = z.object({
  uri: z.string().nonempty(),
  cid: z.string().nonempty(),
});

/**
 * Bluesky投稿情報の型定義
 */
export type BlueskyPost = z.infer<typeof blueskyPostSchema>;
