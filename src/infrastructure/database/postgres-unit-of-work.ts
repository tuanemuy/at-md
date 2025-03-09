/**
 * PostgreSQLを使用したユニットオブワークの実装
 */

import { Result, ok, err, pg } from "../../deps.ts";
import { InfrastructureError } from "../../core/errors/base.ts";
import { UnitOfWork, TransactionContext, TransactionError } from "./unit-of-work.ts";
import { logger } from "../../core/logging/logger.ts";

/**
 * PostgreSQLトランザクションコンテキスト
 */
export class PostgresTransactionContext implements TransactionContext {
  constructor(
    readonly id: string,
    readonly client: pg.PoolClient
  ) {}
}

/**
 * PostgreSQLを使用したユニットオブワーク
 */
export class PostgresUnitOfWork implements UnitOfWork {
  private activeTransactions = new Map<string, PostgresTransactionContext>();

  constructor(private readonly pool: pg.Pool) {}

  /**
   * トランザクションを開始する
   * @returns トランザクションコンテキスト
   */
  async begin(): Promise<Result<TransactionContext, InfrastructureError>> {
    try {
      const client = await this.pool.connect();
      await client.query('BEGIN');
      
      const transactionId = crypto.randomUUID();
      const context = new PostgresTransactionContext(transactionId, client);
      
      this.activeTransactions.set(transactionId, context);
      
      logger.debug(`トランザクション開始: ${transactionId}`);
      return ok(context);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`トランザクション開始エラー: ${errorMessage}`);
      return err(new TransactionError(`トランザクションの開始に失敗しました: ${errorMessage}`));
    }
  }

  /**
   * トランザクションをコミットする
   * @param context トランザクションコンテキスト
   */
  async commit(context: TransactionContext): Promise<Result<void, InfrastructureError>> {
    const transactionContext = this.activeTransactions.get(context.id);
    if (!transactionContext) {
      return err(new TransactionError(`トランザクションが見つかりません: ${context.id}`));
    }

    try {
      await transactionContext.client.query('COMMIT');
      logger.debug(`トランザクションコミット: ${context.id}`);
      
      // クライアントをリリースしてマップから削除
      transactionContext.client.release();
      this.activeTransactions.delete(context.id);
      
      return ok(undefined);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`トランザクションコミットエラー: ${errorMessage}`);
      
      // エラー発生時はロールバックを試みる
      try {
        await transactionContext.client.query('ROLLBACK');
        logger.debug(`トランザクションロールバック (コミットエラー後): ${context.id}`);
      } catch (rollbackError: unknown) {
        const rollbackErrorMessage = rollbackError instanceof Error ? rollbackError.message : String(rollbackError);
        logger.error(`ロールバックエラー: ${rollbackErrorMessage}`);
      }
      
      // クライアントをリリースしてマップから削除
      transactionContext.client.release();
      this.activeTransactions.delete(context.id);
      
      return err(new TransactionError(`トランザクションのコミットに失敗しました: ${errorMessage}`));
    }
  }

  /**
   * トランザクションをロールバックする
   * @param context トランザクションコンテキスト
   */
  async rollback(context: TransactionContext): Promise<Result<void, InfrastructureError>> {
    const transactionContext = this.activeTransactions.get(context.id);
    if (!transactionContext) {
      return err(new TransactionError(`トランザクションが見つかりません: ${context.id}`));
    }

    try {
      await transactionContext.client.query('ROLLBACK');
      logger.debug(`トランザクションロールバック: ${context.id}`);
      
      // クライアントをリリースしてマップから削除
      transactionContext.client.release();
      this.activeTransactions.delete(context.id);
      
      return ok(undefined);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`トランザクションロールバックエラー: ${errorMessage}`);
      
      // クライアントをリリースしてマップから削除
      transactionContext.client.release();
      this.activeTransactions.delete(context.id);
      
      return err(new TransactionError(`トランザクションのロールバックに失敗しました: ${errorMessage}`));
    }
  }

  /**
   * トランザクション内で処理を実行する
   * @param work トランザクション内で実行する処理
   * @returns 処理結果
   */
  async executeInTransaction<T>(
    work: (context: TransactionContext) => Promise<Result<T, InfrastructureError>>
  ): Promise<Result<T, InfrastructureError>> {
    const beginResult = await this.begin();
    if (beginResult.isErr()) {
      return err(beginResult.error);
    }

    const context = beginResult.value;
    
    try {
      const result = await work(context);
      
      if (result.isErr()) {
        // 処理がエラーの場合はロールバック
        await this.rollback(context);
        return result;
      }
      
      // 処理が成功した場合はコミット
      const commitResult = await this.commit(context);
      if (commitResult.isErr()) {
        return err(commitResult.error);
      }
      
      return result;
    } catch (error: unknown) {
      // 予期しないエラーが発生した場合はロールバック
      await this.rollback(context);
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(`トランザクション処理エラー: ${errorMessage}`);
      return err(new TransactionError(`トランザクション処理中にエラーが発生しました: ${errorMessage}`));
    }
  }
} 