/**
 * UIコンポーネントの統合テスト
 * 
 * UIコンポーネント間の連携をテストします。
 */

import { expect } from "@std/expect";
import { describe, it, beforeEach } from "@std/testing/bdd";
import { AppState, Page } from "../../src/presentation/ui/state/app-state.ts";
import { HomePage } from "../../src/presentation/ui/pages/home-page.ts";
import { ContentPage } from "../../src/presentation/ui/pages/content-page.ts";
import { UserPage } from "../../src/presentation/ui/pages/user-page.ts";
import { FeedPage } from "../../src/presentation/ui/pages/feed-page.ts";
import { Router } from "../../src/presentation/ui/router/router.ts";

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

describe("UIコンポーネントの統合テスト", () => {
  let appState: AppState;
  let router: Router;
  let container: { innerHTML: string };
  
  beforeEach(() => {
    // テスト前に毎回実行される
    appState = new AppState({ initialPage: Page.HOME });
    
    // コンテナ要素をモック
    container = { innerHTML: "" };
    
    // ルーターを設定
    router = new Router(appState, mockWindow as unknown as Window);
    
    // URLをリセット
    mockWindow.location.pathname = "/";
    mockWindow.location.search = "";
    mockWindow.location.hash = "";
  });
  
  it("ページ遷移が正しく動作すること", () => {
    // ルーターを開始
    router.start();
    
    // 初期状態ではホームページが表示されていることを検証
    expect(appState.getCurrentPage()).toBe(Page.HOME);
    expect(mockWindow.location.pathname).toBe("/");
    
    // コンテンツ詳細ページに遷移
    appState.navigateToContentDetail("content-1");
    
    // コンテンツ詳細ページが表示されていることを検証
    expect(appState.getCurrentPage()).toBe(Page.CONTENT_DETAIL);
    expect(appState.getSelectedContentId()).toBe("content-1");
    expect(mockWindow.location.pathname).toBe("/content");
    expect(mockWindow.location.search).toBe("?id=content-1");
    
    // ユーザー詳細ページに遷移
    appState.navigateToUserDetail("user-1");
    
    // ユーザー詳細ページが表示されていることを検証
    expect(appState.getCurrentPage()).toBe(Page.USER_DETAIL);
    expect(appState.getSelectedUserId()).toBe("user-1");
    expect(mockWindow.location.pathname).toBe("/user");
    expect(mockWindow.location.search).toBe("?id=user-1");
    
    // フィード詳細ページに遷移
    appState.navigateToFeedDetail("feed-1");
    
    // フィード詳細ページが表示されていることを検証
    expect(appState.getCurrentPage()).toBe(Page.FEED_DETAIL);
    expect(appState.getSelectedFeedId()).toBe("feed-1");
    expect(mockWindow.location.pathname).toBe("/feed");
    expect(mockWindow.location.search).toBe("?id=feed-1");
    
    // ホームページに戻る
    appState.navigateToHome();
    
    // ホームページが表示されていることを検証
    expect(appState.getCurrentPage()).toBe(Page.HOME);
    expect(mockWindow.location.pathname).toBe("/");
    expect(mockWindow.location.search).toBe("");
    
    // ルーターを停止
    router.stop();
  });
  
  it("URLの変更によってページ遷移が発生すること", () => {
    // ルーターを開始
    router.start();
    
    // URLを変更
    mockWindow.location.pathname = "/content";
    mockWindow.location.search = "?id=content-2";
    mockWindow.dispatchEvent(new Event("popstate"));
    
    // コンテンツ詳細ページが表示されていることを検証
    expect(appState.getCurrentPage()).toBe(Page.CONTENT_DETAIL);
    expect(appState.getSelectedContentId()).toBe("content-2");
    
    // 別のURLに変更
    mockWindow.location.pathname = "/user";
    mockWindow.location.search = "?id=user-2";
    mockWindow.dispatchEvent(new Event("popstate"));
    
    // ユーザー詳細ページが表示されていることを検証
    expect(appState.getCurrentPage()).toBe(Page.USER_DETAIL);
    expect(appState.getSelectedUserId()).toBe("user-2");
    
    // ルーターを停止
    router.stop();
  });
  
  it("ホームページが正しくレンダリングされること", () => {
    // モックデータ
    const homePageProps = {
      contentListProps: {
        contents: [],
        onSelect: () => {},
      },
      userListProps: {
        users: [],
        onSelect: () => {},
      },
      feedListProps: {
        feeds: [],
        onSelect: () => {},
      },
      onContentSelect: () => {},
      onUserSelect: () => {},
      onFeedSelect: () => {},
    };
    
    // ホームページをレンダリング
    const homePage = new HomePage(homePageProps);
    const html = homePage.render();
    
    // ホームページが正しくレンダリングされていることを検証
    expect(html.includes("AT-MD ダッシュボード")).toBe(true);
    expect(html.includes("コンテンツ")).toBe(true);
    expect(html.includes("ユーザー")).toBe(true);
    expect(html.includes("フィード")).toBe(true);
  });
  
  it("コンテンツ詳細ページが正しくレンダリングされること", () => {
    // モックデータ
    const contentPageProps = {
      contentDetailProps: {
        content: undefined,
        onEdit: () => {},
        onDelete: () => {},
      },
      onBack: () => {},
      onEdit: () => {},
      onDelete: () => {},
    };
    
    // コンテンツ詳細ページをレンダリング
    const contentPage = new ContentPage(contentPageProps);
    const html = contentPage.render();
    
    // コンテンツ詳細ページが正しくレンダリングされていることを検証
    expect(html.includes("コンテンツ詳細")).toBe(true);
    expect(html.includes("戻る")).toBe(true);
  });
}); 