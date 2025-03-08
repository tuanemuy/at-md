/**
 * コンテンツ詳細表示コンポーネントのテスト
 * 
 * コンテンツの詳細表示機能をテストします。
 */

import { expect } from "@std/expect";
import { describe, it, beforeEach } from "@std/testing/bdd";
import { ContentDetail, ContentDetailProps } from "../components/content-detail.ts";
import { Content } from "../components/content-list.ts";

// モックデータ
const mockContent: Content = {
  id: "content-1",
  title: "テスト記事1",
  path: "/test/article1.md",
  visibility: "public",
  createdAt: "2024-08-01T00:00:00Z",
  updatedAt: "2024-08-01T12:34:56Z",
};

describe("ContentDetailコンポーネントのテスト", () => {
  let props: ContentDetailProps;
  let onEditMock: (id: string) => void;
  let onDeleteMock: (id: string) => void;
  
  beforeEach(() => {
    // テスト前に毎回実行される
    onEditMock = () => {};
    onDeleteMock = () => {};
    props = {
      content: mockContent,
      body: "# テスト記事1\n\nこれはテスト記事の本文です。",
      onEdit: onEditMock,
      onDelete: onDeleteMock,
    };
  });
  
  it("コンテンツ詳細が正しくレンダリングされること", () => {
    // コンポーネントをレンダリング
    const contentDetail = new ContentDetail(props);
    const html = contentDetail.render().replace(/\s+/g, '');
    
    // 結果を検証
    expect(html.includes("テスト記事1")).toBe(true);
    expect(html.includes("/test/article1.md")).toBe(true);
    expect(html.includes("公開")).toBe(true);
    expect(html.includes("<h1>テスト記事1</h1>")).toBe(true);
    expect(html.includes("<p>これはテスト記事の本文です。</p>")).toBe(true);
    expect(html.includes("作成日時:")).toBe(true);
    expect(html.includes("更新日時:")).toBe(true);
  });
  
  it("コンテンツが存在しない場合、メッセージが表示されること", () => {
    // コンテンツなしでプロパティを設定
    props.content = undefined;
    
    // 期待する結果
    const expectedHtml = `
      <div class="content-detail empty">
        <p class="empty-message">コンテンツが選択されていません</p>
      </div>
    `.replace(/\s+/g, '');
    
    // コンポーネントをレンダリング
    const contentDetail = new ContentDetail(props);
    const html = contentDetail.render().replace(/\s+/g, '');
    
    // 結果を検証
    expect(html).toBe(expectedHtml);
  });
  
  it("編集ボタンをクリックすると、onEdit関数が呼ばれること", () => {
    // モックの準備
    let editedId: string | null = null;
    props.onEdit = (id: string) => {
      editedId = id;
    };
    
    // コンポーネントをレンダリング
    const contentDetail = new ContentDetail(props);
    
    // 編集ボタンクリックをシミュレート
    contentDetail.handleEditClick();
    
    // 結果を検証
    expect(editedId).toBe("content-1");
  });
  
  it("削除ボタンをクリックすると、onDelete関数が呼ばれること", () => {
    // モックの準備
    let deletedId: string | null = null;
    props.onDelete = (id: string) => {
      deletedId = id;
    };
    
    // コンポーネントをレンダリング
    const contentDetail = new ContentDetail(props);
    
    // 削除ボタンクリックをシミュレート
    contentDetail.handleDeleteClick();
    
    // 結果を検証
    expect(deletedId).toBe("content-1");
  });
  
  it("マークダウンが正しくレンダリングされること", () => {
    // 複雑なマークダウンを設定
    props.body = "# 見出し1\n## 見出し2\n- リスト項目1\n- リスト項目2\n\n```typescript\nconst x = 1;\n```";
    
    // コンポーネントをレンダリング
    const contentDetail = new ContentDetail(props);
    const html = contentDetail.render();
    
    // マークダウンがHTMLに変換されていることを確認
    expect(html.includes("<h1>見出し1</h1>")).toBe(true);
    expect(html.includes("<h2>見出し2</h2>")).toBe(true);
    expect(html.includes("<li>リスト項目1</li>")).toBe(true);
    expect(html.includes("<li>リスト項目2</li>")).toBe(true);
    expect(html.includes("<code>")).toBe(true);
  });
}); 