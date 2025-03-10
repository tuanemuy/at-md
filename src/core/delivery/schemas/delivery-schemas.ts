/**
 * 配信関連のZodスキーマ定義
 * 
 * 配信ドメインで使用するZodスキーマを定義します。
 */

import { z } from "../deps.ts";
import {
  idSchema,
  contentIdSchema,
  userIdSchema,
  titleSchema,
  dateSchema,
  repositoryIdSchema,
  tagsSchema,
  categoriesSchema,
} from "../../common/schemas/mod.ts";

/**
 * 配信ID用のスキーマ
 */
export const deliveryIdSchema = idSchema.brand<"DeliveryID">();
export type DeliveryID = z.infer<typeof deliveryIdSchema>;

/**
 * 配信先プラットフォーム用のスキーマ
 */
export const platformSchema = z.enum(["twitter", "bluesky", "github", "medium", "devto", "hashnode", "qiita", "zenn"]);
export type Platform = z.infer<typeof platformSchema>;

/**
 * 配信状態用のスキーマ
 */
export const deliveryStatusSchema = z.enum(["pending", "processing", "completed", "failed"]);
export type DeliveryStatus = z.infer<typeof deliveryStatusSchema>;

/**
 * 配信エラー用のスキーマ
 */
export const deliveryErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.record(z.unknown()).optional(),
});
export type DeliveryError = z.infer<typeof deliveryErrorSchema>;

/**
 * 配信結果用のスキーマ
 */
export const deliveryResultSchema = z.object({
  url: z.string().url().optional(),
  externalId: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});
export type DeliveryResult = z.infer<typeof deliveryResultSchema>;

/**
 * 配信エンティティのスキーマ
 */
export const deliverySchema = z.object({
  id: deliveryIdSchema,
  userId: userIdSchema,
  contentId: contentIdSchema,
  platform: platformSchema,
  status: deliveryStatusSchema,
  scheduledAt: dateSchema.optional(),
  startedAt: dateSchema.optional(),
  completedAt: dateSchema.optional(),
  error: deliveryErrorSchema.optional(),
  result: deliveryResultSchema.optional(),
  createdAt: dateSchema,
  updatedAt: dateSchema,
});
export type DeliverySchema = z.infer<typeof deliverySchema>;

/**
 * 配信作成パラメータのスキーマ
 */
export const createDeliveryParamsSchema = z.object({
  userId: userIdSchema,
  contentId: contentIdSchema,
  platform: platformSchema,
  scheduledAt: dateSchema.optional(),
});
export type CreateDeliveryParamsSchema = z.infer<typeof createDeliveryParamsSchema>;

/**
 * 配信更新パラメータのスキーマ
 */
export const updateDeliveryParamsSchema = z.object({
  status: deliveryStatusSchema.optional(),
  scheduledAt: dateSchema.optional(),
  startedAt: dateSchema.optional(),
  completedAt: dateSchema.optional(),
  error: deliveryErrorSchema.optional(),
  result: deliveryResultSchema.optional(),
});
export type UpdateDeliveryParamsSchema = z.infer<typeof updateDeliveryParamsSchema>;

/**
 * 配信設定用のスキーマ
 */
export const deliveryConfigSchema = z.object({
  userId: userIdSchema,
  platform: platformSchema,
  enabled: z.boolean(),
  credentials: z.record(z.string()).optional(),
  settings: z.record(z.unknown()).optional(),
  createdAt: dateSchema,
  updatedAt: dateSchema,
});
export type DeliveryConfigSchema = z.infer<typeof deliveryConfigSchema>;

/**
 * 配信設定作成パラメータのスキーマ
 */
export const createDeliveryConfigParamsSchema = z.object({
  userId: userIdSchema,
  platform: platformSchema,
  enabled: z.boolean().default(true),
  credentials: z.record(z.string()).optional(),
  settings: z.record(z.unknown()).optional(),
});
export type CreateDeliveryConfigParamsSchema = z.infer<typeof createDeliveryConfigParamsSchema>;

/**
 * 配信設定更新パラメータのスキーマ
 */
export const updateDeliveryConfigParamsSchema = z.object({
  enabled: z.boolean().optional(),
  credentials: z.record(z.string()).optional(),
  settings: z.record(z.unknown()).optional(),
});
export type UpdateDeliveryConfigParamsSchema = z.infer<typeof updateDeliveryConfigParamsSchema>; 