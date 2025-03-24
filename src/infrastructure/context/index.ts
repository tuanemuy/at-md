import type { BlueskyAuthProvider } from "@/domain/account/adapters";
import { DefaultBlueskyAuthProvider } from "@/infrastructure/bluesky/auth-provider";
import { db } from "@/infrastructure/db/client";
import {
  type Repositories as DbRepositories,
  createRepositories,
} from "@/infrastructure/db/repositories";
import { logger } from "@/lib/logger";
import type { Logger } from "@/lib/logger";

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

// リポジトリのインターフェース
export type Repositories = DbRepositories;

// APIクライアントのインターフェース
export interface ApiClients {
  blueskyAuthProvider: BlueskyAuthProvider;
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

  // リポジトリを作成
  const repositories = createRepositories(db);

  // BlueskyAuthProviderを作成
  const blueskyAuthProvider = new DefaultBlueskyAuthProvider({
    config: { publicUrl: config.publicUrl },
    deps: {
      authSessionRepository:
        repositories.accountRepositories.authSessionRepository,
      authStateRepository: repositories.accountRepositories.authStateRepository,
    },
  });

  // APIクライアントを初期化
  const apiClients: ApiClients = {
    blueskyAuthProvider,
  };

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
