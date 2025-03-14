import { z } from "zod";
import { v7 as uuidv7 } from "uuid";

/**
 * ID値オブジェクト
 * UUIDv7を使用した一意識別子（タイムスタンプベース）
 */
export const idSchema = z.string().uuid();
export type ID = z.infer<typeof idSchema>;

/**
 * ID値オブジェクトの生成関数
 * @returns 新しいID値オブジェクト（UUIDv7）
 */
export function createId(): ID {
  return uuidv7();
}