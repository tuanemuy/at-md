/**
 * E2Eテスト用のセットアップファイル
 * 
 * このファイルはE2Eテストの実行前に必要な環境設定を行います。
 * - ブラウザ環境のエミュレーション
 * - テスト用のデータベース設定
 * - モックサーバーの起動
 */

import { JSDOM } from "jsdom";

/**
 * ブラウザ環境をエミュレートするためのセットアップ
 */
export function setupBrowserEnvironment(): void {
  const dom = new JSDOM("<!DOCTYPE html><html><body></body></html>", {
    url: "http://localhost:8000",
    referrer: "http://localhost:8000",
    contentType: "text/html",
    includeNodeLocations: true,
    storageQuota: 10000000,
  });

  // DOMをグローバルに設定
  // deno-lint-ignore no-node-globals
  global.window = dom.window as unknown as Window & typeof globalThis;
  // deno-lint-ignore no-node-globals
  global.document = dom.window.document;
  // deno-lint-ignore no-node-globals
  global.navigator = dom.window.navigator;
  // deno-lint-ignore no-node-globals
  global.location = dom.window.location;
  // deno-lint-ignore no-node-globals
  global.history = dom.window.history;
  // deno-lint-ignore no-node-globals
  global.localStorage = dom.window.localStorage;
  // deno-lint-ignore no-node-globals
  global.sessionStorage = dom.window.sessionStorage;
  // deno-lint-ignore no-node-globals
  global.CustomEvent = dom.window.CustomEvent;
  // deno-lint-ignore no-node-globals
  global.Event = dom.window.Event;
  // deno-lint-ignore no-node-globals
  global.HTMLElement = dom.window.HTMLElement;
  // deno-lint-ignore no-node-globals
  global.Element = dom.window.Element;
  // deno-lint-ignore no-node-globals
  global.Node = dom.window.Node;

  // コンソール出力を抑制（必要に応じて）
  const originalConsoleLog = console.log;
  console.log = (...args: unknown[]) => {
    // deno-lint-ignore no-process-global
    if (process.env.DEBUG) {
      originalConsoleLog(...args);
    }
  };
}

/**
 * テスト用のデータベース設定
 */
export function setupTestDatabase(): Promise<void> {
  // テスト用データベースのセットアップロジックをここに実装
  // 例: テスト用のテーブル作成、初期データ投入など
  return Promise.resolve();
}

/**
 * テスト終了時のクリーンアップ処理
 */
export function teardown(): Promise<void> {
  // テスト終了時のクリーンアップロジックをここに実装
  // 例: テスト用データベースの削除、一時ファイルの削除など
  return Promise.resolve();
}

/**
 * テスト用のモックデータを生成する関数
 */
export function generateMockData() {
  return {
    users: [
      {
        id: "user-1",
        username: "testuser1",
        email: "test1@example.com",
        atDid: "did:plc:abcdefg123456",
        atHandle: "test1.bsky.social",
        createdAt: new Date("2023-01-01T00:00:00Z"),
        updatedAt: new Date("2023-01-01T00:00:00Z"),
      },
      {
        id: "user-2",
        username: "testuser2",
        email: "test2@example.com",
        atDid: null,
        atHandle: null,
        createdAt: new Date("2023-01-02T00:00:00Z"),
        updatedAt: new Date("2023-01-02T00:00:00Z"),
      },
    ],
    contents: [
      {
        id: "content-1",
        title: "テスト記事1",
        body: "# テスト記事1\n\nこれはテスト記事です。",
        userId: "user-1",
        createdAt: new Date("2023-01-03T00:00:00Z"),
        updatedAt: new Date("2023-01-03T00:00:00Z"),
      },
      {
        id: "content-2",
        title: "テスト記事2",
        body: "# テスト記事2\n\nこれは2つ目のテスト記事です。",
        userId: "user-1",
        createdAt: new Date("2023-01-04T00:00:00Z"),
        updatedAt: new Date("2023-01-04T00:00:00Z"),
      },
    ],
    feeds: [
      {
        id: "feed-1",
        name: "テストフィード1",
        description: "テスト用のフィード1です",
        userId: "user-1",
        createdAt: new Date("2023-01-05T00:00:00Z"),
        updatedAt: new Date("2023-01-05T00:00:00Z"),
      },
    ],
  };
} 