/**
 * コンテンツ詳細ページコンポーネントのテスト
 * 
 * コンテンツの詳細を表示するページコンポーネントをテストします。
 */

import { expect } from "@std/expect";
import { describe, it, beforeEach } from "@std/testing/bdd";
import { ContentPage, ContentPageProps } from "../../pages/content-page.ts";
import { ContentDetailProps } from "../../components/content-detail.ts";

// モックデータ
const mockContent = {
  id: "content-1",
  title: "テスト記事",
  body: "# テスト記事\n\nこれはテスト記事の本文です。\n\n- 項目1\n- 項目2\n- 項目3",
  path: "/path/to/content",
  visibility: "public",
  tags: ["test", "article"],
  createdAt: "2024-08-01T00:00:00Z",
  updatedAt: "2024-08-01T12:34:56Z",
};

describe("ContentPageコンポーネントのテスト", () => {
  let props: ContentPageProps;
  let onBackMock: () => void;
  let onEditMock: (id: string) => void;
  let onDeleteMock: (id: string) => void;
  
  beforeEach(() => {
    // テスト前に毎回実行される
    onBackMock = () => {};
    onEditMock = () => {};
    onDeleteMock = () => {};
    
    const contentDetailProps: ContentDetailProps = {
      content: mockContent,
      onEdit: () => {},
      onDelete: () => {},
    };
    
    props = {
      contentDetailProps,
      onBack: onBackMock,
      onEdit: onEditMock,
      onDelete: onDeleteMock,
    };
  });
  
  it("コンテンツ詳細ページが正しくレンダリングされること", () => {
    // コンポーネントをレンダリング
    const contentPage = new ContentPage(props);
    const html = contentPage.render();
    
    // 結果を検証
    expect(html.includes("コンテンツ詳細")).toBe(true);
    expect(html.includes("戻る")).toBe(true);
    
    // コンテンツの詳細情報が含まれていることを確認
    // ContentDetailコンポーネントがレンダリングされていることを確認
    expect(html.includes("content-container")).toBe(true);
  });
  
  it("戻るボタンをクリックすると、onBack関数が呼ばれること", () => {
    // モックの準備
    let backCalled = false;
    props.onBack = () => {
      backCalled = true;
    };
    
    // コンポーネントをレンダリング
    const contentPage = new ContentPage(props);
    
    // 戻るボタンクリックをシミュレート
    contentPage.handleBackClick();
    
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
    const contentPage = new ContentPage(props);
    
    // 編集ボタンクリックをシミュレート
    contentPage.handleEditClick("content-1");
    
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
    const contentPage = new ContentPage(props);
    
    // 削除ボタンクリックをシミュレート
    contentPage.handleDeleteClick("content-1");
    
    // 結果を検証
    expect(deletedId).toBe("content-1");
  });
}); 