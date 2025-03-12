import { z } from "zod";
import { generateUniqueId } from "@/lib/uniqueId";

/**
 * ドメインエンティティの識別子
 * 現在の実装ではUUID形式の文字列
 */
export const idSchema = z.string().uuid();
export type ID = z.infer<typeof idSchema>;

/**
 * 新しいIDを生成する
 * @returns 新しいID
 */
export function generateId(): ID {
  return generateUniqueId();
}

/**
 * 文字列をIDに変換する
 * @param value 変換する文字列
 * @returns IDまたはnull（変換できない場合）
 */
export function toId(value: string): ID | null {
  try {
    return idSchema.parse(value);
  } catch (e) {
    return null;
  }
}
