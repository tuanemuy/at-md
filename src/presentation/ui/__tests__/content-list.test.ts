/**
 * コンテンツリスト表示コンポーネントのテスト
 * 
 * コンテンツのリスト表示機能をテストします。
 */

import { expect } from "@std/expect";
import { describe, it, beforeEach } from "@std/testing/bdd";
import { ContentList, ContentListProps } from "../components/content-list.ts";

// モックデータ
const mockContents = [
  {
    id: "content-1",
    title: "テスト記事1",
    path: "/test/article1.md",
    visibility: "public",
    createdAt: "2024-08-01T00:00:00Z",
    updatedAt: "2024-08-01T00:00:00Z",
  },
  {
    id: "content-2",
    title: "テスト記事2",
    path: "/test/article2.md",
    visibility: "private",
    createdAt: "2024-08-02T00:00:00Z",
    updatedAt: "2024-08-02T00:00:00Z",
  },
  {
    id: "content-3",
    title: "テスト記事3",
    path: "/test/article3.md",
    visibility: "public",
    createdAt: "2024-08-03T00:00:00Z",
    updatedAt: "2024-08-03T00:00:00Z",
  },
];

describe("ContentListコンポーネントのテスト", () => {
  let props: ContentListProps;
  let onSelectMock: (id: string) => void;
  
  beforeEach(() => {
    // テスト前に毎回実行される
    onSelectMock = () => {};
    props = {
      contents: mockContents,
      onSelect: onSelectMock,
    };
  });
  
  it("コンテンツリストが正しくレンダリングされること", () => {
    // 期待する結果
    const expectedHtml = `
      <div class="content-list">
        <ul>
          <li data-id="content-1" class="content-item">
            <h3>テスト記事1</h3>
            <p class="path">/test/article1.md</p>
            <span class="visibility public">公開</span>
          </li>
          <li data-id="content-2" class="content-item">
            <h3>テスト記事2</h3>
            <p class="path">/test/article2.md</p>
            <span class="visibility private">非公開</span>
          </li>
          <li data-id="content-3" class="content-item">
            <h3>テスト記事3</h3>
            <p class="path">/test/article3.md</p>
            <span class="visibility public">公開</span>
          </li>
        </ul>
      </div>
    `.replace(/\s+/g, '');
    
    // コンポーネントをレンダリング
    const contentList = new ContentList(props);
    const html = contentList.render().replace(/\s+/g, '');
    
    // 結果を検証
    expect(html).toBe(expectedHtml);
  });
  
  it("空のコンテンツリストの場合、メッセージが表示されること", () => {
    // 空のコンテンツリストでプロパティを設定
    props.contents = [];
    
    // 期待する結果
    const expectedHtml = `
      <div class="content-list empty">
        <p class="empty-message">コンテンツがありません</p>
      </div>
    `.replace(/\s+/g, '');
    
    // コンポーネントをレンダリング
    const contentList = new ContentList(props);
    const html = contentList.render().replace(/\s+/g, '');
    
    // 結果を検証
    expect(html).toBe(expectedHtml);
  });
  
  it("コンテンツアイテムをクリックすると、onSelect関数が呼ばれること", () => {
    // モックの準備
    let selectedId: string | null = null;
    props.onSelect = (id: string) => {
      selectedId = id;
    };
    
    // コンポーネントをレンダリング
    const contentList = new ContentList(props);
    
    // クリックイベントをシミュレート
    contentList.handleItemClick("content-2");
    
    // 結果を検証
    expect(selectedId).toBe("content-2");
  });
  
  it("フィルタリングが機能すること", () => {
    // フィルタリングプロパティを設定
    props.filter = "記事2";
    
    // 期待する結果（記事2のみ表示）
    const expectedHtml = `
      <div class="content-list">
        <ul>
          <li data-id="content-2" class="content-item">
            <h3>テスト記事2</h3>
            <p class="path">/test/article2.md</p>
            <span class="visibility private">非公開</span>
          </li>
        </ul>
      </div>
    `.replace(/\s+/g, '');
    
    // コンポーネントをレンダリング
    const contentList = new ContentList(props);
    const html = contentList.render().replace(/\s+/g, '');
    
    // 結果を検証
    expect(html).toBe(expectedHtml);
  });
  
  it("ソート機能が正しく動作すること", () => {
    // ソートプロパティを設定（タイトルの降順）
    props.sortBy = "title";
    props.sortOrder = "desc";
    
    // 期待する結果（タイトルの降順でソート）
    const expectedHtml = `
      <div class="content-list">
        <ul>
          <li data-id="content-3" class="content-item">
            <h3>テスト記事3</h3>
            <p class="path">/test/article3.md</p>
            <span class="visibility public">公開</span>
          </li>
          <li data-id="content-2" class="content-item">
            <h3>テスト記事2</h3>
            <p class="path">/test/article2.md</p>
            <span class="visibility private">非公開</span>
          </li>
          <li data-id="content-1" class="content-item">
            <h3>テスト記事1</h3>
            <p class="path">/test/article1.md</p>
            <span class="visibility public">公開</span>
          </li>
        </ul>
      </div>
    `.replace(/\s+/g, '');
    
    // コンポーネントをレンダリング
    const contentList = new ContentList(props);
    const html = contentList.render().replace(/\s+/g, '');
    
    // 結果を検証
    expect(html).toBe(expectedHtml);
  });
}); 