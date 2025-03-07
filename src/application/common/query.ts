/**
 * クエリインターフェース
 * アプリケーションレイヤーのクエリパターンを実装するためのインターフェース
 */

import { Result } from "npm:neverthrow";

/**
 * クエリインターフェース
 * すべてのクエリはこのインターフェースを実装する必要があります
 */
export interface Query {
  /**
   * クエリの種類を識別するための名前
   */
  readonly name: string;
}

/**
 * クエリハンドラーインターフェース
 * クエリを処理するハンドラーはこのインターフェースを実装する必要があります
 */
export interface QueryHandler<TQuery extends Query, TResult> {
  /**
   * クエリを実行する
   * @param query 実行するクエリ
   * @returns 実行結果
   */
  execute(query: TQuery): Promise<Result<TResult, Error>>;
}

/**
 * クエリバスインターフェース
 * クエリを適切なハンドラーにディスパッチするためのインターフェース
 */
export interface QueryBus {
  /**
   * クエリを実行する
   * @param query 実行するクエリ
   * @returns 実行結果
   */
  execute<TResult>(query: Query): Promise<Result<TResult, Error>>;
  
  /**
   * クエリハンドラーを登録する
   * @param queryName クエリ名
   * @param handler クエリハンドラー
   */
  register<TQuery extends Query, TResult>(
    queryName: string,
    handler: QueryHandler<TQuery, TResult>
  ): void;
} 