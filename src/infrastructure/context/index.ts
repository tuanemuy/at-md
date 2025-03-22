import { logger } from "@/lib/logger";
import type { Logger } from "@/lib/logger";
import type { BlueskyAuthProvider } from "@/domain/account/adapters";

// アプリケーションの設定
export interface AppConfig {
  environment: string;
  logging: {
    level: string;
  };
  publicUrl: string;
  database: {
    url: string;
  };
  api: {
    github: {
      appId: string;
      privateKey: string;
      clientId: string;
      clientSecret: string;
    };
  };
}

// リポジトリとAPIクライアントのインターフェース
// 後で実装するためにとりあえず空のRecord型を定義
export type Repositories = Record<string, never>;

// APIクライアントのインターフェース
export interface ApiClients {
  blueskyAuthProvider?: BlueskyAuthProvider;
  // 他のAPIクライアントをここに追加
}

// アプリケーションコンテキスト
export interface AppContext {
  config: AppConfig;
  logger: Logger;
  repositories: Repositories;
  apiClients: ApiClients;
}

// コンテキスト作成関数
export const createAppContext = (config: AppConfig): AppContext => {
  // グローバルシングルトンとしてロガーを使用

  // リポジトリとAPIクライアントは後で実装
  const repositories: Repositories = {};
  const apiClients: ApiClients = {};

  return {
    config,
    logger,
    repositories,
    apiClients,
  };
};

// コンテキストを利用するためのヘルパー
export type ContextDependencies<T extends keyof AppContext> = Pick<
  AppContext,
  T
>;
