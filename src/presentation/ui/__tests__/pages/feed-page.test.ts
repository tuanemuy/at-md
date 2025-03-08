/**
 * フィード詳細ページコンポーネントのテスト
 * 
 * フィードの詳細を表示するページコンポーネントをテストします。
 */

import { expect } from "@std/expect";
import { describe, it, beforeEach } from "@std/testing/bdd";
import { FeedPage, FeedPageProps } from "../../pages/feed-page.ts";
import { FeedDetailProps } from "../../components/feed-detail.ts";
import { Feed } from "../../components/feed-list.ts";
import { Post } from "../../components/feed-detail.ts";

// モックデータ
const mockFeed: Feed = {
  id: "feed-1",
  userId: "user-1",
  name: "テクノロジーブログ",
  slug: "tech-blog",
  description: "技術関連の記事を配信するフィード",
  tags: ["tech", "programming"],
  isPublic: true,
  createdAt: "2024-08-01T00:00:00Z",
  updatedAt: "2024-08-01T12:34:56Z",
};

const mockPosts: Post[] = [
  {
    id: "post-1",
    feedId: "feed-1",
    contentId: "content-1",
    title: "JavaScriptの最新機能",
    status: "published",
    publishedAt: "2024-08-02T00:00:00Z",
    createdAt: "2024-08-01T00:00:00Z",
    updatedAt: "2024-08-02T00:00:00Z",
  },
  {
    id: "post-2",
    feedId: "feed-1",
    contentId: "content-2",
    title: "TypeScriptの型システム",
    status: "draft",
    publishedAt: null,
    createdAt: "2024-08-03T00:00:00Z",
    updatedAt: "2024-08-03T00:00:00Z",
  },
];

describe("FeedPageコンポーネントのテスト", () => {
  let props: FeedPageProps;
  let onBackMock: () => void;
  let onEditMock: (id: string) => void;
  let onDeleteMock: (id: string) => void;
  let onCreatePostMock: (feedId: string) => void;
  let onEditPostMock: (postId: string) => void;
  let onPublishPostMock: (postId: string) => void;
  
  beforeEach(() => {
    // テスト前に毎回実行される
    onBackMock = () => {};
    onEditMock = () => {};
    onDeleteMock = () => {};
    onCreatePostMock = () => {};
    onEditPostMock = () => {};
    onPublishPostMock = () => {};
    
    const feedDetailProps: FeedDetailProps = {
      feed: mockFeed,
      posts: mockPosts,
      onEdit: () => {},
      onDelete: () => {},
      onCreatePost: () => {},
      onEditPost: () => {},
      onPublishPost: () => {},
    };
    
    props = {
      feedDetailProps,
      onBack: onBackMock,
      onEdit: onEditMock,
      onDelete: onDeleteMock,
      onCreatePost: onCreatePostMock,
      onEditPost: onEditPostMock,
      onPublishPost: onPublishPostMock,
    };
  });
  
  it("フィード詳細ページが正しくレンダリングされること", () => {
    // コンポーネントをレンダリング
    const feedPage = new FeedPage(props);
    const html = feedPage.render();
    
    // 結果を検証
    expect(html.includes("フィード詳細")).toBe(true);
    expect(html.includes("戻る")).toBe(true);
    
    // フィード詳細コンテナが含まれていることを確認
    expect(html.includes("feed-container")).toBe(true);
  });
  
  it("戻るボタンをクリックすると、onBack関数が呼ばれること", () => {
    // モックの準備
    let backCalled = false;
    props.onBack = () => {
      backCalled = true;
    };
    
    // コンポーネントをレンダリング
    const feedPage = new FeedPage(props);
    
    // 戻るボタンクリックをシミュレート
    feedPage.handleBackClick();
    
    // 結果を検証
    expect(backCalled).toBe(true);
  });
  
  it("編集ボタンをクリックすると、onEdit関数が呼ばれること", () => {
    // モックの準備
    let editedId: string | null = null;
    props.onEdit = (id: string) => {
      editedId = id;
    };
    
    // コンポーネントをレンダリング
    const feedPage = new FeedPage(props);
    
    // 編集ボタンクリックをシミュレート
    feedPage.handleEditClick("feed-1");
    
    // 結果を検証
    expect(editedId).toBe("feed-1");
  });
  
  it("削除ボタンをクリックすると、onDelete関数が呼ばれること", () => {
    // モックの準備
    let deletedId: string | null = null;
    props.onDelete = (id: string) => {
      deletedId = id;
    };
    
    // コンポーネントをレンダリング
    const feedPage = new FeedPage(props);
    
    // 削除ボタンクリックをシミュレート
    feedPage.handleDeleteClick("feed-1");
    
    // 結果を検証
    expect(deletedId).toBe("feed-1");
  });
  
  it("投稿作成ボタンをクリックすると、onCreatePost関数が呼ばれること", () => {
    // モックの準備
    let createdFeedId: string | null = null;
    props.onCreatePost = (feedId: string) => {
      createdFeedId = feedId;
    };
    
    // コンポーネントをレンダリング
    const feedPage = new FeedPage(props);
    
    // 投稿作成ボタンクリックをシミュレート
    feedPage.handleCreatePostClick("feed-1");
    
    // 結果を検証
    expect(createdFeedId).toBe("feed-1");
  });
  
  it("投稿編集ボタンをクリックすると、onEditPost関数が呼ばれること", () => {
    // モックの準備
    let editedPostId: string | null = null;
    props.onEditPost = (postId: string) => {
      editedPostId = postId;
    };
    
    // コンポーネントをレンダリング
    const feedPage = new FeedPage(props);
    
    // 投稿編集ボタンクリックをシミュレート
    feedPage.handleEditPostClick("post-1");
    
    // 結果を検証
    expect(editedPostId).toBe("post-1");
  });
  
  it("投稿公開ボタンをクリックすると、onPublishPost関数が呼ばれること", () => {
    // モックの準備
    let publishedPostId: string | null = null;
    props.onPublishPost = (postId: string) => {
      publishedPostId = postId;
    };
    
    // コンポーネントをレンダリング
    const feedPage = new FeedPage(props);
    
    // 投稿公開ボタンクリックをシミュレート
    feedPage.handlePublishPostClick("post-2");
    
    // 結果を検証
    expect(publishedPostId).toBe("post-2");
  });
}); 