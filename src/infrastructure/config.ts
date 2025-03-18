import { z } from "zod";
import { logger } from "@/lib/logger";
import type { AppConfig } from "./context";

// 環境変数のスキーマ定義
const envSchema = z.object({
  // 基本設定
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  LOG_LEVEL: z.enum(["error", "warn", "info", "debug"]).default("info"),
  
  // データベース設定
  DATABASE_URL: z.string().min(1),
  
  // GitHub API設定
  GITHUB_APP_ID: z.string().min(1),
  GITHUB_PRIVATE_KEY: z.string().min(1),
  GITHUB_CLIENT_ID: z.string().min(1),
  GITHUB_CLIENT_SECRET: z.string().min(1),
  
  // Bluesky API設定
  BLUESKY_SERVICE_URL: z.string().url().default("https://bsky.social"),
});

// 環境変数からAppConfigを作成
export const loadConfig = (): AppConfig => {
  try {
    // 環境変数を検証
    const env = envSchema.parse(process.env);
    
    return {
      environment: env.NODE_ENV,
      logging: {
        level: env.LOG_LEVEL,
      },
      database: {
        url: env.DATABASE_URL,
      },
      api: {
        github: {
          appId: env.GITHUB_APP_ID,
          privateKey: env.GITHUB_PRIVATE_KEY,
          clientId: env.GITHUB_CLIENT_ID,
          clientSecret: env.GITHUB_CLIENT_SECRET,
        },
        bluesky: {
          serviceUrl: env.BLUESKY_SERVICE_URL,
        },
      },
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      logger.error("環境変数の検証に失敗しました", {
        errors: error.errors,
      });
      // 開発環境では詳細なエラーを表示
      if (process.env.NODE_ENV !== "production") {
        console.error("環境変数の設定が不正です:", error.format());
      }
    } else {
      logger.error("設定のロードに失敗しました", { error });
    }
    throw new Error("アプリケーション設定の読み込みに失敗しました");
  }
}; 