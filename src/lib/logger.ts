/**
 * ログレベル
 */
export type LogLevel = "debug" | "info" | "warn" | "error";

/**
 * ロガーインターフェース
 */
export interface Logger {
  // biome-ignore lint/suspicious/noExplicitAny: ロガーの引数は任意の型を許容する必要がある
  debug(message: string, ...args: any[]): void;
  // biome-ignore lint/suspicious/noExplicitAny: ロガーの引数は任意の型を許容する必要がある
  info(message: string, ...args: any[]): void;
  // biome-ignore lint/suspicious/noExplicitAny: ロガーの引数は任意の型を許容する必要がある
  warn(message: string, ...args: any[]): void;
  // biome-ignore lint/suspicious/noExplicitAny: ロガーの引数は任意の型を許容する必要がある
  error(message: string, ...args: any[]): void;
}

/**
 * ログ出力を抑制するかどうかを判定する
 * @returns ログ出力を抑制する場合はtrue
 */
function shouldSkipLogging(): boolean {
  return process.env.SKIP_LOG === "true";
}

/**
 * コンソールロガー
 * 開発環境用のシンプルなロガー
 */
class ConsoleLogger implements Logger {
  // biome-ignore lint/suspicious/noExplicitAny: ロガーの引数は任意の型を許容する必要がある
  debug(message: string, ...args: any[]): void {
    if (shouldSkipLogging()) return;
    console.debug(`[DEBUG] ${message}`, ...args);
  }

  // biome-ignore lint/suspicious/noExplicitAny: ロガーの引数は任意の型を許容する必要がある
  info(message: string, ...args: any[]): void {
    if (shouldSkipLogging()) return;
    console.info(`[INFO] ${message}`, ...args);
  }

  // biome-ignore lint/suspicious/noExplicitAny: ロガーの引数は任意の型を許容する必要がある
  warn(message: string, ...args: any[]): void {
    if (shouldSkipLogging()) return;
    console.warn(`[WARN] ${message}`, ...args);
  }

  // biome-ignore lint/suspicious/noExplicitAny: ロガーの引数は任意の型を許容する必要がある
  error(message: string, ...args: any[]): void {
    if (shouldSkipLogging()) return;
    console.error(`[ERROR] ${message}`, ...args);
  }
}

/**
 * 本番環境用ロガー
 * 本番環境ではdebugログを出力しない
 */
class ProductionLogger implements Logger {
  // biome-ignore lint/suspicious/noExplicitAny: ロガーの引数は任意の型を許容する必要がある
  debug(message: string, ...args: any[]): void {
    // 本番環境ではdebugログを出力しない
  }

  // biome-ignore lint/suspicious/noExplicitAny: ロガーの引数は任意の型を許容する必要がある
  info(message: string, ...args: any[]): void {
    if (shouldSkipLogging()) return;
    console.info(`[INFO] ${message}`, ...args);
  }

  // biome-ignore lint/suspicious/noExplicitAny: ロガーの引数は任意の型を許容する必要がある
  warn(message: string, ...args: any[]): void {
    if (shouldSkipLogging()) return;
    console.warn(`[WARN] ${message}`, ...args);
  }

  // biome-ignore lint/suspicious/noExplicitAny: ロガーの引数は任意の型を許容する必要がある
  error(message: string, ...args: any[]): void {
    if (shouldSkipLogging()) return;
    console.error(`[ERROR] ${message}`, ...args);
  }
}

/**
 * 環境に応じたロガーを取得する
 * @returns ロガーインスタンス
 */
export function getLogger(): Logger {
  const isDevelopment = process.env.NODE_ENV === "development";
  return isDevelopment ? new ConsoleLogger() : new ProductionLogger();
}

// デフォルトロガーのエクスポート
export const logger = getLogger();
