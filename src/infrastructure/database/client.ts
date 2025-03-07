/**
 * データベースクライアント
 */

import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { Logger } from "../../core/logging/logger.ts";

// スキーマのインポート
import * as contentSchema from "./schema/content.ts";
import * as deliverySchema from "./schema/delivery.ts";

// 環境変数からデータベース接続情報を取得
const DATABASE_URL = Deno.env.get("DATABASE_URL") || "postgres://postgres:postgres@localhost:5432/at_md";

// シングルトンインスタンス
let dbInstance: DrizzleClient | null = null;

/**
 * Drizzleクライアントクラス
 * データベース接続の作成と解放を管理する
 */
export class DrizzleClient {
  /**
   * Drizzleデータベースクライアント
   */
  public readonly db: ReturnType<typeof drizzle>;
  
  /**
   * PostgreSQL接続プール
   */
  private readonly pool: pg.Pool;
  
  /**
   * コンストラクタ
   * @param connectionString データベース接続文字列
   * @param logger ロガー
   */
  constructor(connectionString: string = DATABASE_URL, logger?: Logger) {
    // 接続オプション
    const connectionOptions = {
      max: 10, // 最大接続数
      idle_timeout: 30, // アイドルタイムアウト（秒）
      connect_timeout: 10, // 接続タイムアウト（秒）
    };
    
    // 接続プールの作成
    this.pool = new pg.Pool({
      connectionString,
      ...connectionOptions
    });
    
    // クエリログを出力する場合
    if (logger) {
      // TODO: postgres.jsの型定義が不完全なため、デバッグ機能は一時的に無効化
      // client.debug((connection, query, params, types) => {
      //   logger.debug("SQL Query", { query, params });
      // });
      logger.debug("Database client created", { connectionString });
    }
    
    // Drizzleクライアントの作成
    this.db = drizzle({
      client: this.pool,
      schema: {
        ...contentSchema,
        ...deliverySchema
      }
    });
  }
  
  /**
   * データベース接続を閉じる
   * @returns 成功した場合はtrue
   */
  async close(): Promise<boolean> {
    try {
      await this.pool.end();
      return true;
    } catch (error) {
      console.error("Failed to close database connection", error);
      return false;
    }
  }
}

/**
 * Drizzleクライアントを作成する
 * @param connectionString データベース接続文字列
 * @param logger ロガー
 * @returns Drizzleクライアント
 */
export function createDrizzleClient(
  connectionString: string = DATABASE_URL,
  logger?: Logger
): DrizzleClient {
  return new DrizzleClient(connectionString, logger);
}

/**
 * Drizzleクライアントのシングルトンインスタンスを取得する
 * @param logger ロガー
 * @returns Drizzleクライアント
 */
export function getDrizzleClient(logger?: Logger): DrizzleClient {
  if (!dbInstance) {
    dbInstance = createDrizzleClient(DATABASE_URL, logger);
  }
  
  return dbInstance;
}

/**
 * シングルトンのDrizzleクライアント接続を閉じる
 * @param logger ロガー
 * @returns 成功した場合はtrue
 */
export async function closeDbConnection(logger?: Logger): Promise<boolean> {
  if (dbInstance) {
    const result = await dbInstance.close();
    if (result) {
      dbInstance = null;
    }
    return result;
  }
  return false;
} 