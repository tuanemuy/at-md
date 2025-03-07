/**
 * コマンドインターフェース
 * アプリケーションレイヤーのコマンドパターンを実装するためのインターフェース
 */

import { Result } from "npm:neverthrow";

/**
 * コマンドインターフェース
 * すべてのコマンドはこのインターフェースを実装する必要があります
 */
export interface Command {
  /**
   * コマンドの種類を識別するための名前
   */
  readonly name: string;
}

/**
 * コマンドハンドラーインターフェース
 * コマンドを処理するハンドラーはこのインターフェースを実装する必要があります
 */
export interface CommandHandler<TCommand extends Command, TResult> {
  /**
   * コマンドを実行する
   * @param command 実行するコマンド
   * @returns 実行結果
   */
  execute(command: TCommand): Promise<Result<TResult, Error>>;
}

/**
 * コマンドバスインターフェース
 * コマンドを適切なハンドラーにディスパッチするためのインターフェース
 */
export interface CommandBus {
  /**
   * コマンドを実行する
   * @param command 実行するコマンド
   * @returns 実行結果
   */
  execute<TResult>(command: Command): Promise<Result<TResult, Error>>;
  
  /**
   * コマンドハンドラーを登録する
   * @param commandName コマンド名
   * @param handler コマンドハンドラー
   */
  register<TCommand extends Command, TResult>(
    commandName: string,
    handler: CommandHandler<TCommand, TResult>
  ): void;
} 