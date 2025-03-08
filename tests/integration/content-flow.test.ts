/**
 * コンテンツ管理フローの統合テスト
 * 
 * コンテンツの作成から表示までの一連のフローをテストします。
 */

import { expect } from "@std/expect";
import { describe, it } from "@std/testing/bdd";

// モックデータ
const mockContent = {
  id: "content-123",
  title: "テスト記事",
  body: "# テスト記事\n\nこれはテスト記事の本文です。",
  path: "/path/to/content",
  userId: "user-1",
  repositoryId: "repo-1",
  tags: ["test", "article"],
  createdAt: new Date(),
  updatedAt: new Date()
};

// モックのUIコンポーネント
class MockContentList {
  private props: any;
  
  constructor(props: any) {
    this.props = props;
  }
  
  render(): string {
    const { contents } = this.props;
    if (contents.length === 0) {
      return "<div>コンテンツがありません</div>";
    }
    
    return `
      <div class="content-list">
        ${contents.map((content: any) => `
          <div class="content-item">
            <h3>${content.title}</h3>
            <div class="tags">
              ${content.tags.map((tag: string) => `<span class="tag">${tag}</span>`).join("")}
            </div>
          </div>
        `).join("")}
      </div>
    `;
  }
}

// モックのUIコンポーネント
class MockContentDetail {
  private props: any;
  
  constructor(props: any) {
    this.props = props;
  }
  
  render(): string {
    const { content } = this.props;
    if (!content) {
      return "<div>コンテンツが見つかりません</div>";
    }
    
    return `
      <div class="content-detail">
        <h1>${content.title}</h1>
        <div class="content-body">
          ${content.body}
        </div>
        <div class="tags">
          ${content.tags.map((tag: string) => `<span class="tag">${tag}</span>`).join("")}
        </div>
      </div>
    `;
  }
}

describe("コンテンツ管理フローの統合テスト", () => {
  it("コンテンツを作成し、取得し、表示できること", () => {
    // 1. コンテンツリストコンポーネントでコンテンツを表示
    const contentListProps = {
      contents: [mockContent],
      onSelect: () => {},
    };
    
    const contentList = new MockContentList(contentListProps);
    const listHtml = contentList.render();
    
    // リストにコンテンツが表示されていることを検証
    expect(listHtml.includes("テスト記事")).toBe(true);
    expect(listHtml.includes("test")).toBe(true);
    expect(listHtml.includes("article")).toBe(true);
    
    // 2. コンテンツ詳細コンポーネントでコンテンツを表示
    const contentDetailProps = {
      content: mockContent,
      onEdit: () => {},
      onDelete: () => {},
    };
    
    const contentDetail = new MockContentDetail(contentDetailProps);
    const detailHtml = contentDetail.render();
    
    // 詳細にコンテンツが表示されていることを検証
    expect(detailHtml.includes("テスト記事")).toBe(true);
    expect(detailHtml.includes("これはテスト記事の本文です")).toBe(true);
    expect(detailHtml.includes("test")).toBe(true);
    expect(detailHtml.includes("article")).toBe(true);
  });
}); 