/**
 * フィードリスト表示コンポーネントのテスト
 * 
 * フィードのリスト表示機能をテストします。
 */

import { expect } from "@std/expect";
import { describe, it, beforeEach } from "@std/testing/bdd";
import { FeedList, FeedListProps } from "../components/feed-list.ts";

// モックデータ
const mockFeeds = [
  {
    id: "feed-1",
    userId: "user-1",
    name: "テクノロジーブログ",
    slug: "tech-blog",
    description: "技術関連の記事を配信するフィード",
    tags: ["tech", "programming", "web"],
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
  {
    id: "feed-3",
    userId: "user-1",
    name: "写真ブログ",
    slug: "photo-blog",
    description: "写真を共有するフィード",
    tags: ["photo", "travel"],
    isPublic: true,
    createdAt: "2024-08-03T00:00:00Z",
    updatedAt: "2024-08-03T00:00:00Z",
  },
];

describe("FeedListコンポーネントのテスト", () => {
  let props: FeedListProps;
  let onSelectMock: (id: string) => void;
  
  beforeEach(() => {
    // テスト前に毎回実行される
    onSelectMock = () => {};
    props = {
      feeds: mockFeeds,
      onSelect: onSelectMock,
    };
  });
  
  it("フィードリストが正しくレンダリングされること", () => {
    // コンポーネントをレンダリング
    const feedList = new FeedList(props);
    const html = feedList.render();
    
    // 結果を検証
    expect(html.includes("テクノロジーブログ")).toBe(true);
    expect(html.includes("日記")).toBe(true);
    expect(html.includes("写真ブログ")).toBe(true);
    expect(html.includes("tech-blog")).toBe(true);
    expect(html.includes("diary")).toBe(true);
    expect(html.includes("photo-blog")).toBe(true);
    expect(html.includes("公開")).toBe(true);
    expect(html.includes("非公開")).toBe(true);
    expect(html.includes("tech")).toBe(true);
    expect(html.includes("diary")).toBe(true);
    expect(html.includes("photo")).toBe(true);
  });
  
  it("空のフィードリストの場合、メッセージが表示されること", () => {
    // 空のフィードリストでプロパティを設定
    props.feeds = [];
    
    // 期待する結果
    const expectedHtml = `
      <div class="feed-list empty">
        <p class="empty-message">フィードがありません</p>
      </div>
    `.replace(/\s+/g, '');
    
    // コンポーネントをレンダリング
    const feedList = new FeedList(props);
    const html = feedList.render().replace(/\s+/g, '');
    
    // 結果を検証
    expect(html).toBe(expectedHtml);
  });
  
  it("フィードアイテムをクリックすると、onSelect関数が呼ばれること", () => {
    // モックの準備
    let selectedId: string | null = null;
    props.onSelect = (id: string) => {
      selectedId = id;
    };
    
    // コンポーネントをレンダリング
    const feedList = new FeedList(props);
    
    // クリックイベントをシミュレート
    feedList.handleItemClick("feed-2");
    
    // 結果を検証
    expect(selectedId).toBe("feed-2");
  });
  
  it("フィルタリングが機能すること", () => {
    // フィルタリングプロパティを設定
    props.filter = "写真";
    
    // コンポーネントをレンダリング
    const feedList = new FeedList(props);
    const html = feedList.render();
    
    // 結果を検証
    expect(html.includes("写真ブログ")).toBe(true);
    expect(html.includes("テクノロジーブログ")).toBe(false);
    expect(html.includes("日記")).toBe(false);
  });
  
  it("タグによるフィルタリングが機能すること", () => {
    // タグフィルタリングプロパティを設定
    props.tagFilter = "tech";
    
    // コンポーネントをレンダリング
    const feedList = new FeedList(props);
    const html = feedList.render();
    
    // 結果を検証
    expect(html.includes("テクノロジーブログ")).toBe(true);
    expect(html.includes("日記")).toBe(false);
    expect(html.includes("写真ブログ")).toBe(false);
  });
  
  it("公開状態によるフィルタリングが機能すること", () => {
    // 公開状態フィルタリングプロパティを設定
    props.publicFilter = false;
    
    // コンポーネントをレンダリング
    const feedList = new FeedList(props);
    const html = feedList.render();
    
    // 結果を検証
    expect(html.includes("日記")).toBe(true);
    expect(html.includes("テクノロジーブログ")).toBe(false);
    expect(html.includes("写真ブログ")).toBe(false);
  });
  
  it("ソート機能が正しく動作すること", () => {
    // ソートプロパティを設定（名前の降順）
    props.sortBy = "name";
    props.sortOrder = "desc";
    
    // コンポーネントをレンダリング
    const feedList = new FeedList(props);
    
    // 降順でソートされていることを確認
    const feeds = feedList.filterFeeds();
    const sortedFeeds = feedList.sortFeeds(feeds);
    
    // 日本語の文字列比較では、「写真ブログ」「日記」「テクノロジーブログ」の順になる
    expect(sortedFeeds[0].name).toBe("日記");
    expect(sortedFeeds[1].name).toBe("写真ブログ");
    expect(sortedFeeds[2].name).toBe("テクノロジーブログ");
  });
}); 