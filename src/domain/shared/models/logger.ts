/**
 * ログレベル
 */
export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
}

/**
 * ログメタデータ
 */
export interface LogMetadata {
  [key: string]: unknown;
}

/**
 * ロガーインターフェース
 */
export interface Logger {
  /**
   * エラーログを記録
   * @param message ログメッセージ
   * @param metadata 追加のメタデータ
   */
  error(message: string, metadata?: LogMetadata): void;

  /**
   * 警告ログを記録
   * @param message ログメッセージ
   * @param metadata 追加のメタデータ
   */
  warn(message: string, metadata?: LogMetadata): void;

  /**
   * 情報ログを記録
   * @param message ログメッセージ
   * @param metadata 追加のメタデータ
   */
  info(message: string, metadata?: LogMetadata): void;

  /**
   * デバッグログを記録
   * @param message ログメッセージ
   * @param metadata 追加のメタデータ
   */
  debug(message: string, metadata?: LogMetadata): void;
} 