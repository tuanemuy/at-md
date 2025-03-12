import { v7 as uuidv7 } from "uuid";

/**
 * 一意のIDを生成する
 * 現在の実装ではUUIDv7を使用
 * @returns 一意のID文字列
 */
export function generateUniqueId(): string {
  return uuidv7();
}
