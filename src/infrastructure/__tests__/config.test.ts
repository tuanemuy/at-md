import { expect, test, vi, beforeEach } from "vitest";
import { loadConfig } from "../config";

// スナップショットを保存する
vi.mock("@/lib/logger", () => ({
  logger: {
    error: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}));

// オリジナルの環境変数を保存
const originalEnv = { ...process.env };

beforeEach(() => {
  // 環境変数をリセット
  vi.resetModules();
  // テスト用の環境変数を設定
  process.env = { } as NodeJS.ProcessEnv;
  
  // consoleのエラーを抑制（テスト時に余計なログを表示しないため）
  vi.spyOn(console, 'error').mockImplementation(() => {});
  
  return () => {
    // テスト後に環境変数を元に戻す
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  };
});

test("必要な環境変数がある場合に有効な設定を返すこと", () => {
  // vitest環境では、process.envは直接操作可能
  Object.assign(process.env, {
    NODE_ENV: "development",
    LOG_LEVEL: "debug",
    DATABASE_URL: "postgresql://user:password@localhost:5432/test",
    GITHUB_APP_ID: "app-id",
    GITHUB_PRIVATE_KEY: "private-key",
    GITHUB_CLIENT_ID: "client-id",
    GITHUB_CLIENT_SECRET: "client-secret",
    BLUESKY_SERVICE_URL: "https://bsky.social",
  });

  // 設定をロード
  const config = loadConfig();

  // 設定を検証
  expect(config).toEqual({
    environment: "development",
    logging: {
      level: "debug",
    },
    database: {
      url: "postgresql://user:password@localhost:5432/test",
    },
    api: {
      github: {
        appId: "app-id",
        privateKey: "private-key",
        clientId: "client-id",
        clientSecret: "client-secret",
      },
      bluesky: {
        serviceUrl: "https://bsky.social",
      },
    },
  });
});

test("必須の環境変数が不足している場合にエラーをスローすること", () => {
  // 必須の環境変数を欠落させる
  Object.assign(process.env, {
    NODE_ENV: "development",
    LOG_LEVEL: "debug",
    // DATABASE_URLを欠落させる
    GITHUB_APP_ID: "app-id",
    GITHUB_PRIVATE_KEY: "private-key",
    GITHUB_CLIENT_ID: "client-id",
    GITHUB_CLIENT_SECRET: "client-secret",
    BLUESKY_SERVICE_URL: "https://bsky.social",
  });

  // 設定ロードでエラーが発生することを検証
  expect(() => loadConfig()).toThrow("アプリケーション設定の読み込みに失敗しました");
});

test("環境変数の検証が正しく行われること", () => {
  // 無効な値の環境変数を設定
  Object.assign(process.env, {
    NODE_ENV: "invalid", // 許可されていない値
    LOG_LEVEL: "debug",
    DATABASE_URL: "postgresql://user:password@localhost:5432/test",
    GITHUB_APP_ID: "app-id",
    GITHUB_PRIVATE_KEY: "private-key",
    GITHUB_CLIENT_ID: "client-id",
    GITHUB_CLIENT_SECRET: "client-secret",
    BLUESKY_SERVICE_URL: "https://bsky.social",
  });

  // 設定ロードでZodエラーが発生することを検証
  expect(() => loadConfig()).toThrow("アプリケーション設定の読み込みに失敗しました");
});

test("デフォルト値が適用されること", () => {
  // 最小限の環境変数を設定（デフォルト値があるものは省略）
  Object.assign(process.env, {
    // NODE_ENVを明示的に設定せず、デフォルト値を使用
    DATABASE_URL: "postgresql://user:password@localhost:5432/test",
    GITHUB_APP_ID: "app-id",
    GITHUB_PRIVATE_KEY: "private-key",
    GITHUB_CLIENT_ID: "client-id",
    GITHUB_CLIENT_SECRET: "client-secret",
    // BLUESKY_SERVICE_URLを省略（デフォルト値が使用される）
  });

  // 設定をロード
  const config = loadConfig();

  // デフォルト値が適用されていることを検証
  expect(config.environment).toEqual("development"); // デフォルト値
  expect(config.logging.level).toEqual("info"); // デフォルト値
  expect(config.api.bluesky.serviceUrl).toEqual("https://bsky.social"); // デフォルト値
}); 