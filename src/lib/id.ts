/**
 * ID生成用のユーティリティ
 */
import { v4 as uuidv4 } from "uuid";

/**
 * 新しいUUIDを生成する
 */
export function generateId(): string {
  return uuidv4();
}
