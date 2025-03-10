/**
 * ユニットオブワークインターフェース
 * 
 * トランザクション管理のためのインターフェース
 */

import { Result } from "./deps.ts";
import { InfrastructureError } from "./deps.ts";
import type { TransactionContext } from "./deps.ts";

/**
 * トランザクションエラー
 */
export class TransactionError extends InfrastructureError {
  constructor(message: string) {
    super(`トランザクション処理に失敗しました: ${message}`);
  }
}

/**
 * ユニットオブワークインターフェース
 */
export interface UnitOfWork {
  /**
   * トランザクションを開始する
   * @returns トランザクションコンテキスト
   */
  begin(): Promise<Result<TransactionContext, InfrastructureError>>;

  /**
   * トランザクションをコミットする
   * @param context トランザクションコンテキスト
   */
  commit(context: TransactionContext): Promise<Result<void, InfrastructureError>>;

  /**
   * トランザクションをロールバックする
   * @param context トランザクションコンテキスト
   */
  rollback(context: TransactionContext): Promise<Result<void, InfrastructureError>>;

  /**
   * トランザクション内で処理を実行する
   * @param work トランザクション内で実行する処理
   * @returns 処理結果
   */
  executeInTransaction<T>(work: (context: TransactionContext) => Promise<Result<T, InfrastructureError>>): Promise<Result<T, InfrastructureError>>;
} 