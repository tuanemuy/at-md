/**
 * ログレベルの定義
 */
export enum LogLevel {
  DEBUG = "debug",
  INFO = "info",
  WARN = "warn",
  ERROR = "error",
}

/**
 * ロガーインターフェース
 */
export interface ILogger {
  debug(message: string, ...args: unknown[]): void;
  info(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, ...args: unknown[]): void;
}

/**
 * ロガークラス
 */
export class Logger implements ILogger {
  private readonly name: string;
  private readonly minLevel: LogLevel;
  
  constructor(name: string, minLevel: LogLevel = LogLevel.DEBUG) {
    this.name = name;
    this.minLevel = minLevel;
  }
  
  /**
   * デバッグレベルのログを出力する
   * @param message メッセージ
   * @param args 追加の引数
   */
  debug(message: string, ...args: unknown[]): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.debug(`[${this.name}] [DEBUG] ${message}`, ...args);
    }
  }
  
  /**
   * 情報レベルのログを出力する
   * @param message メッセージ
   * @param args 追加の引数
   */
  info(message: string, ...args: unknown[]): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.info(`[${this.name}] [INFO] ${message}`, ...args);
    }
  }
  
  /**
   * 警告レベルのログを出力する
   * @param message メッセージ
   * @param args 追加の引数
   */
  warn(message: string, ...args: unknown[]): void {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(`[${this.name}] [WARN] ${message}`, ...args);
    }
  }
  
  /**
   * エラーレベルのログを出力する
   * @param message メッセージ
   * @param args 追加の引数
   */
  error(message: string, ...args: unknown[]): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      console.error(`[${this.name}] [ERROR] ${message}`, ...args);
    }
  }
  
  /**
   * 指定されたレベルのログを出力すべきかどうかを判定
   */
  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
    const minLevelIndex = levels.indexOf(this.minLevel);
    const currentLevelIndex = levels.indexOf(level);
    
    return currentLevelIndex >= minLevelIndex;
  }
}

// シングルトンインスタンス
export const logger = new Logger("App"); 