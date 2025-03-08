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
import { describe, it, beforeAll, afterAll } from "@std/testing/bdd";
import { setupBrowserEnvironment, setupTestDatabase, teardown } from "./setup.ts";
import { AppState, Page } from "../../src/presentation/ui/state/app-state.ts";
import { AppRenderer } from "../../src/presentation/ui/state/app-renderer.ts";
import { Router } from "../../src/presentation/ui/router/router.ts";
import { ContentList, Content } from "../../src/presentation/ui/components/content-list.ts";
import { UserList, User } from "../../src/presentation/ui/components/user-list.ts";
import { FeedList, Feed } from "../../src/presentation/ui/components/feed-list.ts";
import { ContentDetail } from "../../src/presentation/ui/components/content-detail.ts";
import { UserDetail } from "../../src/presentation/ui/components/user-detail.ts";
import { FeedDetail } from "../../src/presentation/ui/components/feed-detail.ts";

describe("アプリケーションE2Eテスト", () => {
  let appState: AppState;
  let appRenderer: AppRenderer;
  let router: Router;
  let mockContents: Content[];
  let mockUsers: User[];
  let mockFeeds: Feed[];
  let rootElement: HTMLElement;

  beforeAll(async () => {
    // テスト環境のセットアップ
    setupBrowserEnvironment();
    await setupTestDatabase();
    
    // モックデータの生成
    mockContents = [
      {
        id: "content-1",
        title: "テスト記事1",
        body: "# テスト記事1\n\nこれはテスト記事です。",
        path: "/path/to/content-1",
        visibility: "public",
        userId: "user-1",
        createdAt: "2023-01-03T00:00:00Z",
        updatedAt: "2023-01-03T00:00:00Z",
      },
      {
        id: "content-2",
        title: "テスト記事2",
        body: "# テスト記事2\n\nこれは2つ目のテスト記事です。",
        path: "/path/to/content-2",
        visibility: "public",
        userId: "user-1",
        createdAt: "2023-01-04T00:00:00Z",
        updatedAt: "2023-01-04T00:00:00Z",
      },
    ];
    
    mockUsers = [
      {
        id: "user-1",
        username: "testuser1",
        email: "test1@example.com",
        atDid: "did:plc:abcdefg123456",
        atHandle: "test1.bsky.social",
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
        name: "テストフィード1",
        description: "テスト用のフィード1です",
        slug: "test-feed-1",
        tags: ["test", "feed"],
        isPublic: true,
        userId: "user-1",
        createdAt: "2023-01-05T00:00:00Z",
        updatedAt: "2023-01-05T00:00:00Z",
      },
    ];
    
    // ルート要素の作成
    rootElement = document.createElement("div");
    rootElement.id = "app";
    document.body.appendChild(rootElement);
    
    // アプリケーション状態の初期化
    appState = new AppState();
    
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
      content: mockContents[0],
      onEdit: () => {},
      onDelete: () => {},
    });
    
    const userDetail = new UserDetail({
      user: mockUsers[0],
      onEdit: () => {},
      onDelete: () => {},
      onConnectAtProtocol: () => {},
    });
    
    const feedDetail = new FeedDetail({
      feed: mockFeeds[0],
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
      contentListProps: contentList,
      userListProps: userList,
      feedListProps: feedList,
      contentDetailProps: contentDetail,
      userDetailProps: userDetail,
      feedDetailProps: feedDetail,
    });
    
    // ルーターの初期化
    router = new Router({
      appState,
    });
    
    // ルーターの開始
    router.start();
    
    // 初期レンダリング
    renderApp();
  });
  
  afterAll(async () => {
    // ルーターの停止
    router.stop();
    
    // テスト環境のクリーンアップ
    await teardown();
  });
  
  // アプリケーションのレンダリング関数
  function renderApp() {
    const html = appRenderer.render();
    rootElement.innerHTML = html;
  }
  
  // イベントリスナーの設定
  appState.addListener(() => {
    renderApp();
  });
  
  it("初期状態ではホームページが表示されること", () => {
    // 初期状態の確認
    expect(appState.getCurrentPage()).toBe(Page.HOME);
    
    // ホームページの要素が存在することを確認
    const html = rootElement.innerHTML;
    expect(html).toContain("ホームページ");
    expect(html).toContain("コンテンツ一覧");
    expect(html).toContain("ユーザー一覧");
    expect(html).toContain("フィード一覧");
    
    // モックデータの内容が表示されていることを確認
    expect(html).toContain(mockContents[0].title);
    expect(html).toContain(mockUsers[0].username);
    expect(html).toContain(mockFeeds[0].name);
  });
  
  it("コンテンツをクリックするとコンテンツ詳細ページに遷移すること", () => {
    // コンテンツ詳細ページへの遷移
    appState.navigateToContentDetail(mockContents[0].id);
    
    // 状態の確認
    expect(appState.getCurrentPage()).toBe(Page.CONTENT_DETAIL);
    expect(appState.getSelectedContentId()).toBe(mockContents[0].id);
    
    // コンテンツ詳細ページの要素が存在することを確認
    const html = rootElement.innerHTML;
    expect(html).toContain("コンテンツ詳細");
    expect(html).toContain(mockContents[0].title);
    expect(html).toContain("戻る");
    expect(html).toContain("編集");
    expect(html).toContain("削除");
  });
  
  it("ユーザーをクリックするとユーザー詳細ページに遷移すること", () => {
    // ホームページに戻る
    appState.navigateToHome();
    
    // ユーザー詳細ページへの遷移
    appState.navigateToUserDetail(mockUsers[0].id);
    
    // 状態の確認
    expect(appState.getCurrentPage()).toBe(Page.USER_DETAIL);
    expect(appState.getSelectedUserId()).toBe(mockUsers[0].id);
    
    // ユーザー詳細ページの要素が存在することを確認
    const html = rootElement.innerHTML;
    expect(html).toContain("ユーザー詳細");
    expect(html).toContain(mockUsers[0].username);
    expect(html).toContain("戻る");
    expect(html).toContain("編集");
    expect(html).toContain("削除");
    
    // AT Protocolの連携状態に応じた表示を確認
    if (mockUsers[0].atDid) {
      expect(html).toContain("AT Protocol連携済み");
    } else {
      expect(html).toContain("AT Protocol連携");
    }
  });
  
  it("フィードをクリックするとフィード詳細ページに遷移すること", () => {
    // ホームページに戻る
    appState.navigateToHome();
    
    // フィード詳細ページへの遷移
    appState.navigateToFeedDetail(mockFeeds[0].id);
    
    // 状態の確認
    expect(appState.getCurrentPage()).toBe(Page.FEED_DETAIL);
    expect(appState.getSelectedFeedId()).toBe(mockFeeds[0].id);
    
    // フィード詳細ページの要素が存在することを確認
    const html = rootElement.innerHTML;
    expect(html).toContain("フィード詳細");
    expect(html).toContain(mockFeeds[0].name);
    expect(html).toContain("戻る");
    expect(html).toContain("編集");
    expect(html).toContain("削除");
    expect(html).toContain("投稿作成");
  });
  
  it("URLが変更されるとそれに対応したページに遷移すること", () => {
    // ホームページに戻る
    appState.navigateToHome();
    
    // URLを変更してコンテンツ詳細ページに遷移
    window.history.pushState({}, "", `/content/${mockContents[1].id}`);
    window.dispatchEvent(new Event("popstate"));
    
    // 状態の確認
    expect(appState.getCurrentPage()).toBe(Page.CONTENT_DETAIL);
    expect(appState.getSelectedContentId()).toBe(mockContents[1].id);
    
    // コンテンツ詳細ページの要素が存在することを確認
    const html = rootElement.innerHTML;
    expect(html).toContain("コンテンツ詳細");
    expect(html).toContain(mockContents[1].title);
  });
  
  it("戻るボタンをクリックするとホームページに戻ること", () => {
    // 戻るボタンのクリックをシミュレート
    appState.navigateToHome();
    
    // 状態の確認
    expect(appState.getCurrentPage()).toBe(Page.HOME);
    
    // ホームページの要素が存在することを確認
    const html = rootElement.innerHTML;
    expect(html).toContain("ホームページ");
  });
}); 