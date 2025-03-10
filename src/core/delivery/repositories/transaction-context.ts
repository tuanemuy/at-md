/**
 * トランザクションコンテキスト
 * データベーストランザクションを表すインターフェース
 */
export interface TransactionContext {
  /**
   * トランザクションID
   */
  id: string;
} 