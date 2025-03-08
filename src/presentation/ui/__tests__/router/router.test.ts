/**
 * Routerのテスト
 */

import { expect } from "@std/expect";
import { describe, it, beforeEach, afterEach } from "@std/testing/bdd";
import { Router } from "../../router/router.ts";
import { AppState, Page } from "../../state/app-state.ts";

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

describe("Routerのテスト", () => {
  let appState: AppState;
  let router: Router;

  beforeEach(() => {
    // テスト前に毎回実行される
    mockWindow.location.pathname = "/";
    mockWindow.location.search = "";
    mockWindow.location.hash = "";
    
    appState = new AppState({ initialPage: Page.HOME });
    router = new Router(appState, mockWindow as unknown as Window);
  });

  afterEach(() => {
    // テスト後に毎回実行される
    router.stop();
  });

  it("現在のURLに基づいて初期状態が設定されること", () => {
    // ホームページのURL
    mockWindow.location.pathname = "/";
    router = new Router(appState, mockWindow as unknown as Window);
    router.start();
    expect(appState.getCurrentPage()).toBe(Page.HOME);

    // コンテンツ詳細ページのURL
    mockWindow.location.pathname = "/content";
    mockWindow.location.search = "?id=content-1";
    router = new Router(appState, mockWindow as unknown as Window);
    router.start();
    expect(appState.getCurrentPage()).toBe(Page.CONTENT_DETAIL);
    expect(appState.getSelectedContentId()).toBe("content-1");

    // ユーザー詳細ページのURL
    mockWindow.location.pathname = "/user";
    mockWindow.location.search = "?id=user-1";
    router = new Router(appState, mockWindow as unknown as Window);
    router.start();
    expect(appState.getCurrentPage()).toBe(Page.USER_DETAIL);
    expect(appState.getSelectedUserId()).toBe("user-1");

    // フィード詳細ページのURL
    mockWindow.location.pathname = "/feed";
    mockWindow.location.search = "?id=feed-1";
    router = new Router(appState, mockWindow as unknown as Window);
    router.start();
    expect(appState.getCurrentPage()).toBe(Page.FEED_DETAIL);
    expect(appState.getSelectedFeedId()).toBe("feed-1");
  });

  it("状態が変更されたときにURLが更新されること", () => {
    router.start();

    // コンテンツ詳細ページに遷移
    appState.navigateToContentDetail("content-1");
    expect(mockWindow.location.pathname).toBe("/content");
    expect(mockWindow.location.search).toBe("?id=content-1");

    // ユーザー詳細ページに遷移
    appState.navigateToUserDetail("user-1");
    expect(mockWindow.location.pathname).toBe("/user");
    expect(mockWindow.location.search).toBe("?id=user-1");

    // フィード詳細ページに遷移
    appState.navigateToFeedDetail("feed-1");
    expect(mockWindow.location.pathname).toBe("/feed");
    expect(mockWindow.location.search).toBe("?id=feed-1");

    // ホームページに遷移
    appState.navigateToHome();
    expect(mockWindow.location.pathname).toBe("/");
    expect(mockWindow.location.search).toBe("");
  });

  it("URLが変更されたときに状態が更新されること", () => {
    router.start();

    // コンテンツ詳細ページのURLに変更
    mockWindow.location.pathname = "/content";
    mockWindow.location.search = "?id=content-1";
    mockWindow.dispatchEvent(new Event("popstate"));
    expect(appState.getCurrentPage()).toBe(Page.CONTENT_DETAIL);
    expect(appState.getSelectedContentId()).toBe("content-1");

    // ユーザー詳細ページのURLに変更
    mockWindow.location.pathname = "/user";
    mockWindow.location.search = "?id=user-1";
    mockWindow.dispatchEvent(new Event("popstate"));
    expect(appState.getCurrentPage()).toBe(Page.USER_DETAIL);
    expect(appState.getSelectedUserId()).toBe("user-1");

    // フィード詳細ページのURLに変更
    mockWindow.location.pathname = "/feed";
    mockWindow.location.search = "?id=feed-1";
    mockWindow.dispatchEvent(new Event("popstate"));
    expect(appState.getCurrentPage()).toBe(Page.FEED_DETAIL);
    expect(appState.getSelectedFeedId()).toBe("feed-1");

    // ホームページのURLに変更
    mockWindow.location.pathname = "/";
    mockWindow.location.search = "";
    mockWindow.dispatchEvent(new Event("popstate"));
    expect(appState.getCurrentPage()).toBe(Page.HOME);
  });

  it("停止後はURLの変更を監視しないこと", () => {
    router.start();
    router.stop();

    // URLを変更
    mockWindow.location.pathname = "/content";
    mockWindow.location.search = "?id=content-1";
    mockWindow.dispatchEvent(new Event("popstate"));

    // 状態が変更されないこと
    expect(appState.getCurrentPage()).toBe(Page.HOME);
  });

  it("未知のパスの場合はホームページに遷移すること", () => {
    router.start();

    // 未知のパスに変更
    mockWindow.location.pathname = "/unknown";
    mockWindow.dispatchEvent(new Event("popstate"));

    // ホームページに遷移すること
    expect(appState.getCurrentPage()).toBe(Page.HOME);
  });
}); 