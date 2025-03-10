/// <reference lib="dom" />

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

  // グローバルオブジェクトにブラウザAPIをセット
  globalThis.window = dom.window as any;
  globalThis.document = dom.window.document;
  globalThis.navigator = dom.window.navigator;
  globalThis.location = dom.window.location;
  globalThis.history = dom.window.history;
  globalThis.localStorage = dom.window.localStorage;
  globalThis.sessionStorage = dom.window.sessionStorage;
  globalThis.CustomEvent = dom.window.CustomEvent;
  globalThis.Event = dom.window.Event;
  globalThis.HTMLElement = dom.window.HTMLElement;
  globalThis.Element = dom.window.Element;
  globalThis.Node = dom.window.Node;

  // コンソールログのモック
  const originalConsoleLog = console.log;
  console.log = (...args: any[]) => {
    if (Deno.env.get("DEBUG")) {
      originalConsoleLog(...args);
    }
  };
}

/**
 * テスト用のデータベース設定
 */
export async function setupTestDatabase(): Promise<void> {
  // テスト用のデータベース設定
  // 実際の実装では、テスト用のデータベースを初期化する処理を記述
  console.log("Setting up test database...");
}

/**
 * テスト終了時のクリーンアップ処理
 */
export async function teardown(): Promise<void> {
  // テスト終了時のクリーンアップ処理
  // 実際の実装では、テスト用のデータベースをクリーンアップする処理を記述
  console.log("Tearing down test environment...");
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