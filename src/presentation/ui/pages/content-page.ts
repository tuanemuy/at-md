/**
 * コンテンツ詳細ページコンポーネント
 * 
 * コンテンツの詳細を表示するページコンポーネントです。
 */

import { ContentDetail, ContentDetailProps } from "../components/content-detail.ts";

// コンテンツ詳細ページのプロパティ型定義
export interface ContentPageProps {
  contentDetailProps: ContentDetailProps;
  onBack: () => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

/**
 * コンテンツ詳細ページコンポーネント
 */
export class ContentPage {
  private props: ContentPageProps;
  
  /**
   * コンストラクタ
   * @param props コンポーネントのプロパティ
   */
  constructor(props: ContentPageProps) {
    this.props = props;
  }
  
  /**
   * 戻るボタンのクリックハンドラ
   */
  public handleBackClick(): void {
    this.props.onBack();
  }
  
  /**
   * 編集ボタンのクリックハンドラ
   * @param id 編集するコンテンツのID
   */
  public handleEditClick(id: string): void {
    this.props.onEdit(id);
  }
  
  /**
   * 削除ボタンのクリックハンドラ
   * @param id 削除するコンテンツのID
   */
  public handleDeleteClick(id: string): void {
    this.props.onDelete(id);
  }
  
  /**
   * コンポーネントをレンダリングする
   * @returns HTML文字列
   */
  public render(): string {
    // コンテンツ詳細コンポーネントのインスタンスを作成
    const contentDetail = new ContentDetail({
      ...this.props.contentDetailProps,
      onEdit: (id) => this.handleEditClick(id),
      onDelete: (id) => this.handleDeleteClick(id)
    });
    
    // コンテンツ詳細をレンダリング
    const contentDetailHtml = contentDetail.render();
    
    // コンテンツ詳細ページのHTMLを構築
    return `
      <div class="content-page">
        <header class="page-header">
          <button class="back-button" id="back-button">← 戻る</button>
          <h1>コンテンツ詳細</h1>
        </header>
        
        <div class="content-container">
          ${contentDetailHtml}
        </div>
      </div>
    `;
  }
} 