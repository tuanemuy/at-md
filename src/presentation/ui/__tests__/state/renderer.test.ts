/**
 * レンダラーのテスト
 * 
 * アプリケーションのレンダリング機能をテストします。
 */

import { expect } from "@std/expect";
import { describe, it, beforeEach, afterEach } from "@std/testing/bdd";
import { JSDOM } from "npm:jsdom";
import { Renderer, RendererProps } from "../../state/renderer.ts";
import { AppState, Page } from "../../state/app-state.ts";
import { HomePage } from "../../pages/home-page.ts";
import { ContentPage } from "../../pages/content-page.ts";
import { UserPage } from "../../pages/user-page.ts";
import { FeedPage } from "../../pages/feed-page.ts";
import { ContentDetailProps } from "../../components/content-detail.ts";
import { UserDetailProps } from "../../components/user-detail.ts";
import { FeedDetailProps } from "../../components/feed-detail.ts";

// グローバルにDOMを設定
const dom = new JSDOM(`<!DOCTYPE html><html><body></body></html>`);
globalThis.document = dom.window.document;
globalThis.HTMLElement = dom.window.HTMLElement;
globalThis.Element = dom.window.Element;
globalThis.NodeList = dom.window.NodeList;

// モックデータ
const mockContentListProps = {
  contents: [],
  onSelect: () => {},
};

const mockUserListProps = {
  users: [],
  onSelect: () => {},
};

const mockFeedListProps = {
  feeds: [],
  onSelect: () => {},
};

const mockContentDetailProps: ContentDetailProps = {
  content: undefined,
  onEdit: () => {},
  onDelete: () => {},
};

const mockUserDetailProps: UserDetailProps = {
  user: undefined,
  onEdit: () => {},
  onDelete: () => {},
  onConnectAtProtocol: () => {},
};

const mockFeedDetailProps: FeedDetailProps = {
  feed: undefined,
  posts: [],
  onEdit: () => {},
  onDelete: () => {},
  onCreatePost: () => {},
  onEditPost: () => {},
  onPublishPost: () => {},
};

describe("Rendererのテスト", () => {
  let appState: AppState;
  let renderer: Renderer;
  let container: HTMLElement;
  
  beforeEach(() => {
    // テスト前に毎回実行される
    appState = new AppState({ initialPage: Page.HOME });
    
    // コンテナ要素を作成
    container = document.createElement("div");
    container.id = "app";
    document.body.appendChild(container);
    
    const props: RendererProps = {
      appState,
      container,
      homePageProps: {
        contentListProps: mockContentListProps,
        userListProps: mockUserListProps,
        feedListProps: mockFeedListProps,
        onContentSelect: () => {},
        onUserSelect: () => {},
        onFeedSelect: () => {},
      },
      contentPageProps: {
        contentDetailProps: mockContentDetailProps,
        onBack: () => {},
        onEdit: () => {},
        onDelete: () => {},
      },
      userPageProps: {
        userDetailProps: mockUserDetailProps,
        onBack: () => {},
        onEdit: () => {},
        onDelete: () => {},
        onConnectAtProtocol: () => {},
      },
      feedPageProps: {
        feedDetailProps: mockFeedDetailProps,
        onBack: () => {},
        onEdit: () => {},
        onDelete: () => {},
        onCreatePost: () => {},
        onEditPost: () => {},
        onPublishPost: () => {},
      },
    };
    
    renderer = new Renderer(props);
  });
  
  afterEach(() => {
    // テスト後に毎回実行される
    document.body.removeChild(container);
  });
  
  it("初期状態でホームページがレンダリングされること", () => {
    // レンダリングを実行
    renderer.render();
    
    // ホームページがレンダリングされていることを検証
    expect(container.innerHTML.includes("AT-MD ダッシュボード")).toBe(true);
  });
  
  it("コンテンツ詳細ページに遷移するとコンテンツ詳細ページがレンダリングされること", () => {
    // コンテンツ詳細ページに遷移
    appState.navigateToContentDetail("content-1");
    
    // レンダリングを実行
    renderer.render();
    
    // コンテンツ詳細ページがレンダリングされていることを検証
    expect(container.innerHTML.includes("コンテンツ詳細")).toBe(true);
  });
  
  it("ユーザー詳細ページに遷移するとユーザー詳細ページがレンダリングされること", () => {
    // ユーザー詳細ページに遷移
    appState.navigateToUserDetail("user-1");
    
    // レンダリングを実行
    renderer.render();
    
    // ユーザー詳細ページがレンダリングされていることを検証
    expect(container.innerHTML.includes("ユーザー詳細")).toBe(true);
  });
  
  it("フィード詳細ページに遷移するとフィード詳細ページがレンダリングされること", () => {
    // フィード詳細ページに遷移
    appState.navigateToFeedDetail("feed-1");
    
    // レンダリングを実行
    renderer.render();
    
    // フィード詳細ページがレンダリングされていることを検証
    expect(container.innerHTML.includes("フィード詳細")).toBe(true);
  });
  
  it("状態が変更されると自動的に再レンダリングされること", () => {
    // 初期レンダリング
    renderer.start();
    
    // 初期状態ではホームページがレンダリングされていることを検証
    expect(container.innerHTML.includes("AT-MD ダッシュボード")).toBe(true);
    
    // コンテンツ詳細ページに遷移
    appState.navigateToContentDetail("content-1");
    
    // 自動的に再レンダリングされ、コンテンツ詳細ページが表示されていることを検証
    expect(container.innerHTML.includes("コンテンツ詳細")).toBe(true);
    
    // レンダリングを停止
    renderer.stop();
  });
  
  it("レンダリングを停止すると状態が変更されても再レンダリングされないこと", () => {
    // 初期レンダリング
    renderer.start();
    
    // レンダリングを停止
    renderer.stop();
    
    // コンテナの内容を一旦クリア
    container.innerHTML = "";
    
    // コンテンツ詳細ページに遷移
    appState.navigateToContentDetail("content-1");
    
    // 再レンダリングされないため、コンテナは空のままであることを検証
    expect(container.innerHTML).toBe("");
  });
}); 