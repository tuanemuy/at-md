/**
 * UIアプリケーションのテスト
 */

import { expect } from "@std/expect";
import { describe, it, afterEach, beforeEach } from "@std/testing/bdd";
import { initializeUI, terminateUI } from "../app.ts";
import { DIContainer } from "../di/container.ts";
import { Page } from "../state/app-state.ts";

// windowオブジェクトのモック
const mockWindow = {
  location: {
    pathname: "/",
    search: "",
    hash: "",
  },
  history: {
    pushState: (_: unknown, __: string, url: string) => {
      const urlObj = new URL(url, "http://localhost");
      mockWindow.location.pathname = urlObj.pathname;
      mockWindow.location.search = urlObj.search;
      mockWindow.location.hash = urlObj.hash;
    },
  },
  addEventListener: (_: string, listener: EventListener) => {
    mockWindow.popStateListener = listener;
  },
  removeEventListener: (_: string, __: EventListener) => {
    mockWindow.popStateListener = null;
  },
  dispatchEvent: (event: Event) => {
    if (event.type === "popstate" && mockWindow.popStateListener) {
      mockWindow.popStateListener(event);
      return true;
    }
    return false;
  },
  popStateListener: null as EventListener | null,
};

// コンソール出力のモック
const originalConsoleInfo = console.info;
let consoleInfoCalled = false;
let consoleInfoMessage = "";

describe("UIアプリケーションのテスト", () => {
  beforeEach(() => {
    // DIコンテナをリセット
    DIContainer.reset();
    
    // コンソール出力をモック
    console.info = (message: string) => {
      consoleInfoCalled = true;
      consoleInfoMessage = message;
    };
    
    // テスト前に毎回実行される
    mockWindow.location.pathname = "/";
    mockWindow.location.search = "";
    mockWindow.location.hash = "";
    consoleInfoCalled = false;
    consoleInfoMessage = "";
  });

  afterEach(() => {
    // テスト後に毎回実行される
    terminateUI();
    console.info = originalConsoleInfo;
  });

  it("アプリケーションが初期化されること", () => {
    initializeUI({ initialPage: Page.HOME }, mockWindow as unknown as Window);
    
    // DIコンテナが初期化されていること
    const container = DIContainer.getInstance();
    expect(container).toBeDefined();
    
    // AppStateが初期化されていること
    const appState = container.getAppState();
    expect(appState).toBeDefined();
    expect(appState.getCurrentPage()).toBe(Page.HOME);
    
    // Routerが初期化されていること
    const router = container.getRouter();
    expect(router).toBeDefined();
    
    // コンソール出力が行われていること
    expect(consoleInfoCalled).toBe(true);
    expect(consoleInfoMessage).toBe("UIアプリケーションが初期化されました");
  });

  it("アプリケーションが終了されること", () => {
    initializeUI({ initialPage: Page.HOME }, mockWindow as unknown as Window);
    terminateUI();
    
    // コンソール出力が行われていること
    expect(consoleInfoCalled).toBe(true);
    expect(consoleInfoMessage).toBe("UIアプリケーションが終了しました");
  });

  it("初期ページが設定されること", () => {
    // DIコンテナをリセット
    DIContainer.reset();
    
    // 初期化前の状態を確認
    console.log("初期化前のDIコンテナ:", DIContainer.getInstance());
    
    // 明示的に初期ページを設定
    initializeUI({ initialPage: Page.CONTENT_DETAIL, initialContentId: "content-1" }, mockWindow as unknown as Window);
    
    // 初期化後の状態を確認
    const container = DIContainer.getInstance();
    const appState = container.getAppState();
    console.log("初期化後のページ:", appState.getCurrentPage());
    console.log("初期化後のコンテンツID:", appState.getSelectedContentId());
    
    // 期待値を確認
    expect(appState.getCurrentPage()).toBe(Page.CONTENT_DETAIL);
    expect(appState.getSelectedContentId()).toBe("content-1");
  });
}); 