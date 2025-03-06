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
  debug(message: string, ...args: any[]): void;
  info(message: string, ...args: any[]): void;
  warn(message: string, ...args: any[]): void;
  error(message: string, ...args: any[]): void;
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
   * デバッグログを出力
   */
  debug(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.debug(`[DEBUG] [${this.name}]:`, message, ...args);
    }
  }
  
  /**
   * 情報ログを出力
   */
  info(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.info(`[INFO] [${this.name}]:`, message, ...args);
    }
  }
  
  /**
   * 警告ログを出力
   */
  warn(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(`[WARN] [${this.name}]:`, message, ...args);
    }
  }
  
  /**
   * エラーログを出力
   */
  error(message: string, ...args: any[]): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      console.error(`[ERROR] [${this.name}]:`, message, ...args);
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