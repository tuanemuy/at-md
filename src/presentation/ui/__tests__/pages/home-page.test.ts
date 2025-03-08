/**
 * ホームページコンポーネントのテスト
 * 
 * アプリケーションのホームページを表示するコンポーネントをテストします。
 */

import { expect } from "@std/expect";
import { describe, it, beforeEach } from "@std/testing/bdd";
import { HomePage, HomePageProps } from "../../pages/home-page.ts";
import { ContentListProps } from "../../components/content-list.ts";
import { UserListProps } from "../../components/user-list.ts";
import { FeedListProps } from "../../components/feed-list.ts";

// モックデータ
const mockContents = [
  {
    id: "content-1",
    title: "テスト記事1",
    body: "これはテスト記事1の本文です。",
    tags: ["test", "article"],
    createdAt: "2024-08-01T00:00:00Z",
    updatedAt: "2024-08-01T00:00:00Z",
  },
  {
    id: "content-2",
    title: "テスト記事2",
    body: "これはテスト記事2の本文です。",
    tags: ["test", "draft"],
    createdAt: "2024-08-02T00:00:00Z",
    updatedAt: "2024-08-02T00:00:00Z",
  },
];

const mockUsers = [
  {
    id: "user-1",
    username: "testuser1",
    email: "test1@example.com",
    atDid: "did:plc:abcdef123456",
    atHandle: "test1.bsky.social",
    createdAt: "2024-08-01T00:00:00Z",
    updatedAt: "2024-08-01T00:00:00Z",
  },
  {
    id: "user-2",
    username: "testuser2",
    email: "test2@example.com",
    atDid: null,
    atHandle: null,
    createdAt: "2024-08-02T00:00:00Z",
    updatedAt: "2024-08-02T00:00:00Z",
  },
];

const mockFeeds = [
  {
    id: "feed-1",
    userId: "user-1",
    name: "テクノロジーブログ",
    slug: "tech-blog",
    description: "技術関連の記事を配信するフィード",
    tags: ["tech", "programming"],
    isPublic: true,
    createdAt: "2024-08-01T00:00:00Z",
    updatedAt: "2024-08-01T00:00:00Z",
  },
  {
    id: "feed-2",
    userId: "user-1",
    name: "日記",
    slug: "diary",
    description: "日々の出来事を記録するフィード",
    tags: ["diary", "personal"],
    isPublic: false,
    createdAt: "2024-08-02T00:00:00Z",
    updatedAt: "2024-08-02T00:00:00Z",
  },
];

describe("HomePageコンポーネントのテスト", () => {
  let props: HomePageProps;
  let contentSelectMock: (id: string) => void;
  let userSelectMock: (id: string) => void;
  let feedSelectMock: (id: string) => void;
  
  beforeEach(() => {
    // テスト前に毎回実行される
    contentSelectMock = () => {};
    userSelectMock = () => {};
    feedSelectMock = () => {};
    
    const contentListProps: ContentListProps = {
      contents: mockContents,
      onSelect: () => {},
    };
    
    const userListProps: UserListProps = {
      users: mockUsers,
      onSelect: () => {},
    };
    
    const feedListProps: FeedListProps = {
      feeds: mockFeeds,
      onSelect: () => {},
    };
    
    props = {
      contentListProps,
      userListProps,
      feedListProps,
      onContentSelect: contentSelectMock,
      onUserSelect: userSelectMock,
      onFeedSelect: feedSelectMock,
    };
  });
  
  it("ホームページが正しくレンダリングされること", () => {
    // コンポーネントをレンダリング
    const homePage = new HomePage(props);
    const html = homePage.render();
    
    // 結果を検証
    expect(html.includes("AT-MD ダッシュボード")).toBe(true);
    expect(html.includes("コンテンツ")).toBe(true);
    expect(html.includes("ユーザー")).toBe(true);
    expect(html.includes("フィード")).toBe(true);
    
    // 各リストのコンテンツが含まれていることを確認
    expect(html.includes("テスト記事1")).toBe(true);
    expect(html.includes("テスト記事2")).toBe(true);
    expect(html.includes("testuser1")).toBe(true);
    expect(html.includes("testuser2")).toBe(true);
    expect(html.includes("テクノロジーブログ")).toBe(true);
    expect(html.includes("日記")).toBe(true);
  });
  
  it("コンテンツ選択時にonContentSelect関数が呼ばれること", () => {
    // モックの準備
    let selectedContentId: string | null = null;
    props.onContentSelect = (id: string) => {
      selectedContentId = id;
    };
    
    // コンポーネントをレンダリング
    const homePage = new HomePage(props);
    
    // コンテンツ選択をシミュレート
    homePage.handleContentSelect("content-1");
    
    // 結果を検証
    expect(selectedContentId).toBe("content-1");
  });
  
  it("ユーザー選択時にonUserSelect関数が呼ばれること", () => {
    // モックの準備
    let selectedUserId: string | null = null;
    props.onUserSelect = (id: string) => {
      selectedUserId = id;
    };
    
    // コンポーネントをレンダリング
    const homePage = new HomePage(props);
    
    // ユーザー選択をシミュレート
    homePage.handleUserSelect("user-2");
    
    // 結果を検証
    expect(selectedUserId).toBe("user-2");
  });
  
  it("フィード選択時にonFeedSelect関数が呼ばれること", () => {
    // モックの準備
    let selectedFeedId: string | null = null;
    props.onFeedSelect = (id: string) => {
      selectedFeedId = id;
    };
    
    // コンポーネントをレンダリング
    const homePage = new HomePage(props);
    
    // フィード選択をシミュレート
    homePage.handleFeedSelect("feed-1");
    
    // 結果を検証
    expect(selectedFeedId).toBe("feed-1");
  });
}); 