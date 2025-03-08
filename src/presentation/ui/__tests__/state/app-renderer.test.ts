/**
 * アプリケーションレンダラーのテスト
 * 
 * アプリケーションの状態に基づいてUIをレンダリングする機能をテストします。
 */

import { expect } from "@std/expect";
import { describe, it, beforeEach } from "@std/testing/bdd";
import { AppState, Page } from "../../state/app-state.ts";
import { AppRenderer, AppRendererProps } from "../../state/app-renderer.ts";
import { HomePage } from "../../pages/home-page.ts";
import { ContentPage } from "../../pages/content-page.ts";
import { UserPage } from "../../pages/user-page.ts";
import { FeedPage } from "../../pages/feed-page.ts";

// モックデータ
const mockContentListProps = {
  contents: [
    {
      id: "content-1",
      title: "テスト記事1",
      body: "テスト本文1",
      path: "/path/to/content1",
      visibility: "public",
      tags: ["test"],
      createdAt: "2024-08-01T00:00:00Z",
      updatedAt: "2024-08-01T00:00:00Z",
    }
  ],
  onSelect: () => {},
};

const mockUserListProps = {
  users: [
    {
      id: "user-1",
      username: "testuser",
      email: "test@example.com",
      atDid: "did:plc:abcdef123456",
      atHandle: "test.bsky.social",
      createdAt: "2024-08-01T00:00:00Z",
      updatedAt: "2024-08-01T00:00:00Z",
    }
  ],
  onSelect: () => {},
};

const mockFeedListProps = {
  feeds: [
    {
      id: "feed-1",
      userId: "user-1",
      name: "テストフィード",
      slug: "test-feed",
      description: "テスト用フィード",
      tags: ["test"],
      isPublic: true,
      createdAt: "2024-08-01T00:00:00Z",
      updatedAt: "2024-08-01T00:00:00Z",
    }
  ],
  onSelect: () => {},
};

const mockContentDetailProps = {
  content: {
    id: "content-1",
    title: "テスト記事1",
    body: "テスト本文1",
    path: "/path/to/content1",
    visibility: "public",
    tags: ["test"],
    createdAt: "2024-08-01T00:00:00Z",
    updatedAt: "2024-08-01T00:00:00Z",
  },
  onEdit: () => {},
  onDelete: () => {},
};

const mockUserDetailProps = {
  user: {
    id: "user-1",
    username: "testuser",
    email: "test@example.com",
    atDid: "did:plc:abcdef123456",
    atHandle: "test.bsky.social",
    createdAt: "2024-08-01T00:00:00Z",
    updatedAt: "2024-08-01T00:00:00Z",
  },
  onEdit: () => {},
  onDelete: () => {},
  onConnectAtProtocol: () => {},
};

const mockFeedDetailProps = {
  feed: {
    id: "feed-1",
    userId: "user-1",
    name: "テストフィード",
    slug: "test-feed",
    description: "テスト用フィード",
    tags: ["test"],
    isPublic: true,
    createdAt: "2024-08-01T00:00:00Z",
    updatedAt: "2024-08-01T00:00:00Z",
  },
  posts: [
    {
      id: "post-1",
      feedId: "feed-1",
      contentId: "content-1",
      title: "テスト投稿",
      status: "published",
      publishedAt: "2024-08-02T00:00:00Z",
      createdAt: "2024-08-01T00:00:00Z",
      updatedAt: "2024-08-02T00:00:00Z",
    }
  ],
  onEdit: () => {},
  onDelete: () => {},
  onCreatePost: () => {},
  onEditPost: () => {},
  onPublishPost: () => {},
};

describe("AppRendererのテスト", () => {
  let appState: AppState;
  let props: AppRendererProps;
  let appRenderer: AppRenderer;
  
  beforeEach(() => {
    // テスト前に毎回実行される
    appState = new AppState({ initialPage: Page.HOME });
    
    props = {
      appState,
      contentListProps: mockContentListProps,
      userListProps: mockUserListProps,
      feedListProps: mockFeedListProps,
      contentDetailProps: mockContentDetailProps,
      userDetailProps: mockUserDetailProps,
      feedDetailProps: mockFeedDetailProps,
    };
    
    appRenderer = new AppRenderer(props);
  });
  
  it("ホームページが正しくレンダリングされること", () => {
    // ホームページに設定
    appState.setCurrentPage(Page.HOME);
    
    // レンダリング
    const html = appRenderer.render();
    
    // 結果を検証
    expect(html.includes("AT-MD ダッシュボード")).toBe(true);
    expect(html.includes("home-page")).toBe(true);
  });
  
  it("コンテンツ詳細ページが正しくレンダリングされること", () => {
    // コンテンツ詳細ページに遷移
    appState.navigateToContentDetail("content-1");
    
    // レンダリング
    const html = appRenderer.render();
    
    // 結果を検証
    expect(html.includes("コンテンツ詳細")).toBe(true);
    expect(html.includes("content-page")).toBe(true);
  });
  
  it("ユーザー詳細ページが正しくレンダリングされること", () => {
    // ユーザー詳細ページに遷移
    appState.navigateToUserDetail("user-1");
    
    // レンダリング
    const html = appRenderer.render();
    
    // 結果を検証
    expect(html.includes("ユーザー詳細")).toBe(true);
    expect(html.includes("user-page")).toBe(true);
  });
  
  it("フィード詳細ページが正しくレンダリングされること", () => {
    // フィード詳細ページに遷移
    appState.navigateToFeedDetail("feed-1");
    
    // レンダリング
    const html = appRenderer.render();
    
    // 結果を検証
    expect(html.includes("フィード詳細")).toBe(true);
    expect(html.includes("feed-page")).toBe(true);
  });
  
  it("状態変更時にリスナーが呼び出されること", () => {
    // リスナーのモック
    let callCount = 0;
    const listener = () => {
      callCount++;
    };
    
    // リスナーを登録
    appState.addChangeListener(listener);
    
    // 状態を変更（ページとコンテンツIDの2つの状態が変更される）
    appState.navigateToContentDetail("content-1");
    
    // リスナーが呼び出されたことを検証
    expect(callCount).toBe(2);
  });
}); 