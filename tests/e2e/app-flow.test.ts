/// <reference lib="dom" />

/**
 * アプリケーションのE2Eテスト
 * 
 * このテストはユーザーがアプリケーションを使用する一連のフローをテストします。
 * - ホームページの表示
 * - コンテンツ詳細ページへの遷移
 * - ユーザー詳細ページへの遷移
 * - フィード詳細ページへの遷移
 */

import { expect } from "@std/expect";
import { describe, it, beforeEach, afterEach } from "@std/testing/bdd";
import { AppState, Page } from "../../src/presentation/ui/state/app-state.ts";
import { Router } from "../../src/presentation/ui/router/router.ts";
import { AppRenderer } from "../../src/presentation/ui/state/app-renderer.ts";
import { ContentList, Content } from "../../src/presentation/ui/components/content-list.ts";
import { UserList, User } from "../../src/presentation/ui/components/user-list.ts";
import { FeedList, Feed } from "../../src/presentation/ui/components/feed-list.ts";
import { ContentDetail } from "../../src/presentation/ui/components/content-detail.ts";
import { UserDetail } from "../../src/presentation/ui/components/user-detail.ts";
import { FeedDetail } from "../../src/presentation/ui/components/feed-detail.ts";

describe("アプリケーションE2Eテスト", () => {
  // テスト用の変数
  let rootElement: HTMLElement;
  let appState: AppState;
  let router: Router;
  let appRenderer: AppRenderer;
  
  // モックデータ
  let mockContents: Content[];
  let mockUsers: User[];
  let mockFeeds: Feed[];
  
  beforeEach(() => {
    // DOMのセットアップ
    rootElement = document.createElement("div");
    rootElement.id = "app";
    document.body.appendChild(rootElement);
    
    // モックデータの初期化
    mockContents = [
      {
        id: "content-1",
        title: "テスト記事1",
        path: "/path/to/content-1",
        visibility: "public",
        createdAt: "2023-01-03T00:00:00Z",
        updatedAt: "2023-01-03T00:00:00Z",
      },
      {
        id: "content-2",
        title: "テスト記事2",
        path: "/path/to/content-2",
        visibility: "public",
        createdAt: "2023-01-04T00:00:00Z",
        updatedAt: "2023-01-04T00:00:00Z",
      },
    ];
    
    mockUsers = [
      {
        id: "user-1",
        username: "testuser1",
        email: "test1@example.com",
        atDid: null,
        atHandle: null,
        createdAt: "2023-01-01T00:00:00Z",
        updatedAt: "2023-01-01T00:00:00Z",
      },
      {
        id: "user-2",
        username: "testuser2",
        email: "test2@example.com",
        atDid: null,
        atHandle: null,
        createdAt: "2023-01-02T00:00:00Z",
        updatedAt: "2023-01-02T00:00:00Z",
      },
    ];
    
    mockFeeds = [
      {
        id: "feed-1",
        userId: "user-1",
        name: "テストフィード1",
        slug: "test-feed-1",
        description: "テストフィード1の説明",
        tags: ["テスト", "フィード"],
        isPublic: true,
        createdAt: "2023-01-05T00:00:00Z",
        updatedAt: "2023-01-05T00:00:00Z",
      },
    ];
    
    // アプリケーション状態の初期化
    appState = new AppState({
      initialPage: Page.HOME
    });
    
    // コンポーネントの初期化
    const contentList = new ContentList({
      contents: mockContents,
      onSelect: (contentId: string) => {
        appState.navigateToContentDetail(contentId);
      },
    });
    
    const userList = new UserList({
      users: mockUsers,
      onSelect: (userId: string) => {
        appState.navigateToUserDetail(userId);
      },
    });
    
    const feedList = new FeedList({
      feeds: mockFeeds,
      onSelect: (feedId: string) => {
        appState.navigateToFeedDetail(feedId);
      },
    });
    
    const contentDetail = new ContentDetail({
      content: undefined,
      onEdit: () => {},
      onDelete: () => {},
    });
    
    const userDetail = new UserDetail({
      user: undefined,
      onEdit: () => {},
      onDelete: () => {},
      onConnectAtProtocol: () => {},
    });
    
    const feedDetail = new FeedDetail({
      feed: undefined,
      posts: [],
      onEdit: () => {},
      onDelete: () => {},
      onCreatePost: () => {},
      onEditPost: () => {},
      onPublishPost: () => {},
    });
    
    // レンダラーの初期化
    appRenderer = new AppRenderer({
      appState,
      contentListProps: {
        contents: mockContents,
        onSelect: (contentId: string) => {
          appState.navigateToContentDetail(contentId);
        }
      },
      userListProps: {
        users: mockUsers,
        onSelect: (userId: string) => {
          appState.navigateToUserDetail(userId);
        }
      },
      feedListProps: {
        feeds: mockFeeds,
        onSelect: (feedId: string) => {
          appState.navigateToFeedDetail(feedId);
        }
      },
      contentDetailProps: {
        content: undefined,
        onEdit: () => {},
        onDelete: () => {}
      },
      userDetailProps: {
        user: undefined,
        onEdit: () => {},
        onDelete: () => {},
        onConnectAtProtocol: () => {}
      },
      feedDetailProps: {
        feed: undefined,
        posts: [],
        onEdit: () => {},
        onDelete: () => {},
        onCreatePost: () => {},
        onEditPost: () => {},
        onPublishPost: () => {}
      },
    });
    
    // ルーターの初期化
    router = new Router(appState);
    
    // レンダラーとルーターを開始
    router.start();
  });
  
  afterEach(() => {
    // クリーンアップ
    router.stop();
    document.body.removeChild(rootElement);
  });
  
  // レンダリング関数
  function renderApp() {
    const html = appRenderer.render();
    rootElement.innerHTML = html;
  }
  
  // イベントリスナーの設定
  beforeEach(() => {
    appState.addListener(() => {
      renderApp();
    });
  });
  
  // テストケース
  it("ホーム画面からコンテンツ詳細画面に遷移できること", () => {
    // 初期状態の確認
    renderApp();
    expect(appState.getCurrentPage()).toBe(Page.HOME);
    
    // コンテンツリストが表示されていることを確認
    const html = rootElement.innerHTML;
    expect(html).toContain("テスト記事1");
    expect(html).toContain("テスト記事2");
    
    // コンテンツをクリック
    const contentLink = rootElement.querySelector(`[data-content-id="${mockContents[0].id}"]`);
    if (contentLink) {
      contentLink.dispatchEvent(new Event("click"));
      
      // 状態が更新されたことを確認
      expect(appState.getCurrentPage()).toBe(Page.CONTENT_DETAIL);
      expect(appState.getSelectedContentId()).toBe(mockContents[0].id);
      
      // コンテンツ詳細が表示されていることを確認
      const detailHtml = rootElement.innerHTML;
      expect(detailHtml).toContain(mockContents[0].title);
    } else {
      throw new Error("コンテンツリンクが見つかりません");
    }
  });
  
  it("ユーザー詳細画面に遷移できること", () => {
    // ユーザーリストを表示
    appState.navigateToHome();
    renderApp();
    
    // ユーザーをクリック
    const userLink = rootElement.querySelector(`[data-user-id="${mockUsers[0].id}"]`);
    if (userLink) {
      userLink.dispatchEvent(new Event("click"));
      
      // 状態が更新されたことを確認
      expect(appState.getCurrentPage()).toBe(Page.USER_DETAIL);
      expect(appState.getSelectedUserId()).toBe(mockUsers[0].id);
      
      // ユーザー詳細が表示されていることを確認
      const html = rootElement.innerHTML;
      expect(html).toContain(mockUsers[0].username);
      
      // AT Protocolの連携状態に応じた表示を確認
      if (mockUsers[0].atDid) {
        expect(html).toContain("AT Protocol連携済み");
      } else {
        expect(html).toContain("AT Protocol連携");
      }
    } else {
      throw new Error("ユーザーリンクが見つかりません");
    }
  });
  
  it("フィード詳細画面に遷移できること", () => {
    // フィードリストを表示
    appState.navigateToHome();
    renderApp();
    
    // フィードをクリック
    const feedLink = rootElement.querySelector(`[data-feed-id="${mockFeeds[0].id}"]`);
    if (feedLink) {
      feedLink.dispatchEvent(new Event("click"));
      
      // 状態が更新されたことを確認
      expect(appState.getCurrentPage()).toBe(Page.FEED_DETAIL);
      expect(appState.getSelectedFeedId()).toBe(mockFeeds[0].id);
      
      // フィード詳細が表示されていることを確認
      const html = rootElement.innerHTML;
      expect(html).toContain(mockFeeds[0].name);
      expect(html).toContain(mockFeeds[0].description);
    } else {
      throw new Error("フィードリンクが見つかりません");
    }
  });
}); 