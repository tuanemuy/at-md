/**
 * フィード詳細表示コンポーネントのテスト
 * 
 * フィードの詳細表示機能をテストします。
 */

import { expect } from "@std/expect";
import { describe, it, beforeEach } from "@std/testing/bdd";
import { FeedDetail, FeedDetailProps } from "../components/feed-detail.ts";
import { Feed } from "../components/feed-list.ts";

// モックデータ
const mockFeed: Feed = {
  id: "feed-1",
  userId: "user-1",
  name: "テクノロジーブログ",
  slug: "tech-blog",
  description: "技術関連の記事を配信するフィード",
  tags: ["tech", "programming", "web"],
  isPublic: true,
  createdAt: "2024-08-01T00:00:00Z",
  updatedAt: "2024-08-01T12:34:56Z",
};

const mockPosts = [
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

describe("FeedDetailコンポーネントのテスト", () => {
  let props: FeedDetailProps;
  let onEditMock: (id: string) => void;
  let onDeleteMock: (id: string) => void;
  let onCreatePostMock: (feedId: string) => void;
  let onEditPostMock: (postId: string) => void;
  let onPublishPostMock: (postId: string) => void;
  
  beforeEach(() => {
    // テスト前に毎回実行される
    onEditMock = () => {};
    onDeleteMock = () => {};
    onCreatePostMock = () => {};
    onEditPostMock = () => {};
    onPublishPostMock = () => {};
    props = {
      feed: mockFeed,
      posts: mockPosts,
      onEdit: onEditMock,
      onDelete: onDeleteMock,
      onCreatePost: onCreatePostMock,
      onEditPost: onEditPostMock,
      onPublishPost: onPublishPostMock,
    };
  });
  
  it("フィード詳細が正しくレンダリングされること", () => {
    // コンポーネントをレンダリング
    const feedDetail = new FeedDetail(props);
    const html = feedDetail.render();
    
    // 結果を検証
    expect(html.includes("テクノロジーブログ")).toBe(true);
    expect(html.includes("tech-blog")).toBe(true);
    expect(html.includes("技術関連の記事を配信するフィード")).toBe(true);
    expect(html.includes("tech")).toBe(true);
    expect(html.includes("programming")).toBe(true);
    expect(html.includes("web")).toBe(true);
    expect(html.includes("公開")).toBe(true);
    expect(html.includes("編集")).toBe(true);
    expect(html.includes("削除")).toBe(true);
    expect(html.includes("投稿を作成")).toBe(true);
    expect(html.includes("JavaScriptの最新機能")).toBe(true);
    expect(html.includes("TypeScriptの型システム")).toBe(true);
    expect(html.includes("公開済")).toBe(true);
    expect(html.includes("下書き")).toBe(true);
  });
  
  it("フィードが存在しない場合、メッセージが表示されること", () => {
    // フィードなしでプロパティを設定
    props.feed = undefined;
    
    // 期待する結果
    const expectedHtml = `
      <div class="feed-detail empty">
        <p class="empty-message">フィードが選択されていません</p>
      </div>
    `.replace(/\s+/g, '');
    
    // コンポーネントをレンダリング
    const feedDetail = new FeedDetail(props);
    const html = feedDetail.render().replace(/\s+/g, '');
    
    // 結果を検証
    expect(html).toBe(expectedHtml);
  });
  
  it("投稿がない場合、メッセージが表示されること", () => {
    // 投稿なしでプロパティを設定
    props.posts = [];
    
    // コンポーネントをレンダリング
    const feedDetail = new FeedDetail(props);
    const html = feedDetail.render();
    
    // 結果を検証
    expect(html.includes("投稿がありません")).toBe(true);
  });
  
  it("編集ボタンをクリックすると、onEdit関数が呼ばれること", () => {
    // モックの準備
    let editedId: string | null = null;
    props.onEdit = (id: string) => {
      editedId = id;
    };
    
    // コンポーネントをレンダリング
    const feedDetail = new FeedDetail(props);
    
    // 編集ボタンクリックをシミュレート
    feedDetail.handleEditClick();
    
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
    const feedDetail = new FeedDetail(props);
    
    // 削除ボタンクリックをシミュレート
    feedDetail.handleDeleteClick();
    
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
    const feedDetail = new FeedDetail(props);
    
    // 投稿作成ボタンクリックをシミュレート
    feedDetail.handleCreatePostClick();
    
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
    const feedDetail = new FeedDetail(props);
    
    // 投稿編集ボタンクリックをシミュレート
    feedDetail.handleEditPostClick("post-2");
    
    // 結果を検証
    expect(editedPostId).toBe("post-2");
  });
  
  it("投稿公開ボタンをクリックすると、onPublishPost関数が呼ばれること", () => {
    // モックの準備
    let publishedPostId: string | null = null;
    props.onPublishPost = (postId: string) => {
      publishedPostId = postId;
    };
    
    // コンポーネントをレンダリング
    const feedDetail = new FeedDetail(props);
    
    // 投稿公開ボタンクリックをシミュレート
    feedDetail.handlePublishPostClick("post-2");
    
    // 結果を検証
    expect(publishedPostId).toBe("post-2");
  });
}); 