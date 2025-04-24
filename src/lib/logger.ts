import { createLogger, format, transports } from "winston";
import type { Logger as WinstonLogger } from "winston";

/**
 * ロギングレベル
 */
export type LogLevel = "error" | "warn" | "info" | "debug";

/**
 * アプリケーション共通のロガー
 * 構造化ログを出力するためのグローバルシングルトン
 */
export class Logger {
  private static instance: Logger;
  private logger: WinstonLogger;

  private constructor() {
    this.logger = createLogger({
      level: process.env.NODE_ENV === "production" ? "info" : "debug",
      format: format.combine(
        format.timestamp({
          format: "YYYY-MM-DD HH:mm:ss",
        }),
        format.errors({ stack: true }),
        format.splat(),
        format.json(),
        format.prettyPrint(),
      ),
      defaultMeta: { service: "at-md" },
      transports: [
        // 開発環境ではコンソールに出力
        new transports.Console(),
        // 本番環境ではファイルにも出力（オプション）
        ...(process.env.NODE_ENV === "production"
          ? [
              new transports.File({
                filename: "logs/error.log",
                level: "error",
              }),
              new transports.File({ filename: "logs/combined.log" }),
            ]
          : []),
      ],
    });
  }

  /**
   * ロガーのインスタンスを取得
   */
  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  /**
   * エラーログを出力
   * @param message ログメッセージ
   * @param meta 追加情報（オブジェクト）
   * biome-ignore lint:
   */
  public error(message: string, ...meta: any[]): void {
    this.logger.error(message, meta);
  }

  /**
   * 警告ログを出力
   * @param message ログメッセージ
   * @param meta 追加情報（オブジェクト）
   * biome-ignore lint:
   */
  public warn(message: string, ...meta: any[]): void {
    this.logger.warn(message, meta);
  }

  /**
   * 情報ログを出力
   * @param message ログメッセージ
   * @param meta 追加情報（オブジェクト）
   * biome-ignore lint:
   */
  public info(message: string, ...meta: any[]): void {
    this.logger.info(message, meta);
  }

  /**
   * デバッグログを出力
   * @param message ログメッセージ
   * @param meta 追加情報（オブジェクト）
   * biome-ignore lint:
   */
  public debug(message: string, ...meta: any[]): void {
    this.logger.debug(message, meta);
  }

  /**
   * 指定されたレベルでログを出力
   * @param level ログレベル
   * @param message ログメッセージ
   * @param meta 追加情報（オブジェクト）
   */
  public log(
    level: LogLevel,
    message: string,
    meta?: Record<string, unknown>,
  ): void {
    this.logger.log(level, message, meta);
  }
}

/**
 * グローバルなロガーインスタンス
 * アプリケーション全体で利用可能
 */
export const logger = Logger.getInstance();
