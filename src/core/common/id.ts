import { uuidv7 } from "uuidv7";

/**
 * ID生成のためのインターフェース
 */
export interface IdGenerator {
  /**
   * 新しいIDを生成する
   * @returns 生成されたID
   */
  generate(): string;
}

/**
 * UUIDv7を使用したID生成の実装
 */
export class UUIDv7Generator implements IdGenerator {
  /**
   * UUIDv7を使用して新しいIDを生成する
   * @returns 生成されたUUIDv7
   */
  generate(): string {
    return uuidv7();
  }
}

/**
 * UUIDv4を使用したID生成の実装
 */
export class UUIDv4Generator implements IdGenerator {
  /**
   * UUIDv4を使用して新しいIDを生成する
   * @returns 生成されたUUIDv4
   */
  generate(): string {
    // crypto APIを使用してUUIDv4を生成
    return crypto.randomUUID();
  }
}

/**
 * デフォルトのID生成器のインスタンス
 * UUIDv7を使用
 */
export const defaultIdGenerator: IdGenerator = new UUIDv7Generator();

/**
 * 新しいIDを生成する
 * @returns 生成されたID
 */
export function generateId(): string {
  return defaultIdGenerator.generate();
} 