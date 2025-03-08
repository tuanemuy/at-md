/**
 * ルーターのテスト
 * 
 * URLベースのルーティング機能をテストします。
 */

import { expect } from "@std/expect";
import { describe, it, beforeEach, afterEach } from "@std/testing/bdd";
import { Router, RouterProps, Route } from "../../router/router.ts";
import { AppState, Page } from "../../state/app-state.ts";

// グローバルにwindowとlocationをモック
const mockWindow = {
  location: {
    pathname: "/",
  },
  history: {
    pushState: (_state: any, _title: string, url: string) => {
      mockWindow.location.pathname = url;
    },
  },
  addEventListener: () => {},
  removeEventListener: () => {},
};

// グローバル変数を設定
globalThis.window = mockWindow as any;

describe("Routerのテスト", () => {
  let appState: AppState;
  let router: Router;
  
  beforeEach(() => {
    // テスト前に毎回実行される
    appState = new AppState({ initialPage: Page.HOME });
    
    const routes: Route[] = [
      { path: "/", page: Page.HOME },
      { path: "/content/:id", page: Page.CONTENT_DETAIL },
      { path: "/user/:id", page: Page.USER_DETAIL },
      { path: "/feed/:id", page: Page.FEED_DETAIL },
    ];
    
    const props: RouterProps = {
      appState,
      routes,
    };
    
    // パスをリセット
    mockWindow.location.pathname = "/";
    
    router = new Router(props);
  });
  
  afterEach(() => {
    // テスト後に毎回実行される
    router.stop();
    // URLをリセット
    mockWindow.location.pathname = "/";
  });
  
  it("初期化時に現在のURLに基づいて状態が設定されること", () => {
    // URLを設定
    mockWindow.location.pathname = "/content/content-1";
    
    // ルーターを初期化
    router = new Router({
      appState,
      routes: [
        { path: "/", page: Page.HOME },
        { path: "/content/:id", page: Page.CONTENT_DETAIL },
        { path: "/user/:id", page: Page.USER_DETAIL },
        { path: "/feed/:id", page: Page.FEED_DETAIL },
      ],
    });
    
    // 状態が正しく設定されていることを検証
    expect(appState.getCurrentPage()).toBe(Page.CONTENT_DETAIL);
    expect(appState.getSelectedContentId()).toBe("content-1");
  });
  
  it("状態が変更されるとURLが更新されること", () => {
    // ルーターを開始
    router.start();
    
    // コンテンツ詳細ページに遷移
    appState.navigateToContentDetail("content-2");
    
    // URLが更新されていることを検証
    expect(mockWindow.location.pathname).toBe("/content/content-2");
    
    // ユーザー詳細ページに遷移
    appState.navigateToUserDetail("user-1");
    
    // URLが更新されていることを検証
    expect(mockWindow.location.pathname).toBe("/user/user-1");
    
    // フィード詳細ページに遷移
    appState.navigateToFeedDetail("feed-1");
    
    // URLが更新されていることを検証
    expect(mockWindow.location.pathname).toBe("/feed/feed-1");
    
    // ホームページに遷移
    appState.navigateToHome();
    
    // URLが更新されていることを検証
    expect(mockWindow.location.pathname).toBe("/");
  });
  
  it("URLが変更されると状態が更新されること", () => {
    // ルーターを開始
    router.start();
    
    // URLを変更
    mockWindow.location.pathname = "/content/content-3";
    
    // 状態を同期
    router["syncStateFromUrl"]();
    
    // 状態が更新されていることを検証
    expect(appState.getCurrentPage()).toBe(Page.CONTENT_DETAIL);
    expect(appState.getSelectedContentId()).toBe("content-3");
    
    // 別のURLに変更
    mockWindow.location.pathname = "/user/user-2";
    
    // 状態を同期
    router["syncStateFromUrl"]();
    
    // 状態が更新されていることを検証
    expect(appState.getCurrentPage()).toBe(Page.USER_DETAIL);
    expect(appState.getSelectedUserId()).toBe("user-2");
  });
  
  it("ルーターを停止すると状態変更時にURLが更新されないこと", () => {
    // ルーターを開始
    router.start();
    
    // ルーターを停止
    router.stop();
    
    // コンテンツ詳細ページに遷移
    appState.navigateToContentDetail("content-4");
    
    // URLが更新されていないことを検証
    expect(mockWindow.location.pathname).toBe("/");
  });
  
  it("マッチするルートがない場合はホームページに遷移すること", () => {
    // ルーターを開始
    router.start();
    
    // 存在しないパスにURLを変更
    mockWindow.location.pathname = "/unknown/path";
    
    // 状態を同期
    router["syncStateFromUrl"]();
    
    // ホームページに遷移していることを検証
    expect(appState.getCurrentPage()).toBe(Page.HOME);
  });
}); 