/**
 * コンテンツ詳細表示コンポーネント
 * 
 * コンテンツの詳細表示機能を提供します。
 */

import { Content } from "./content-list.ts";

// コンポーネントのプロパティ型定義
export interface ContentDetailProps {
  content?: Content;
  body?: string;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

/**
 * コンテンツ詳細表示コンポーネント
 */
export class ContentDetail {
  private props: ContentDetailProps;
  
  /**
   * コンストラクタ
   * @param props コンポーネントのプロパティ
   */
  constructor(props: ContentDetailProps) {
    this.props = props;
  }
  
  /**
   * 編集ボタンのクリックハンドラ
   */
  public handleEditClick(): void {
    if (this.props.content) {
      this.props.onEdit(this.props.content.id);
    }
  }
  
  /**
   * 削除ボタンのクリックハンドラ
   */
  public handleDeleteClick(): void {
    if (this.props.content) {
      this.props.onDelete(this.props.content.id);
    }
  }
  
  /**
   * 日時を整形する
   * @param dateString ISO形式の日時文字列
   * @returns 整形された日時文字列
   */
  private formatDate(dateString: string): string {
    const date = new Date(dateString);
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  }
  
  /**
   * マークダウンをHTMLに変換する
   * @param markdown マークダウン文字列
   * @returns HTML文字列
   */
  private renderMarkdown(markdown: string): string {
    // 簡易的なマークダウンパーサー（テスト用）
    let html = markdown;
    
    // 見出し
    html = html.replace(/^# (.*?)$/gm, '<h1>$1</h1>');
    html = html.replace(/^## (.*?)$/gm, '<h2>$1</h2>');
    html = html.replace(/^### (.*?)$/gm, '<h3>$1</h3>');
    
    // リスト
    html = html.replace(/^- (.*?)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*?<\/li>\n)+/g, '<ul>$&</ul>');
    
    // コードブロック
    html = html.replace(/```(.*?)\n([\s\S]*?)```/g, '<pre><code>$2</code></pre>');
    
    // 段落
    html = html.replace(/^(?!<[a-z])(.*?)$/gm, '<p>$1</p>');
    
    // 空の段落を削除
    html = html.replace(/<p><\/p>/g, '');
    
    return html;
  }
  
  /**
   * コンポーネントをレンダリングする
   * @returns HTML文字列
   */
  public render(): string {
    if (!this.props.content) {
      return `
        <div class="content-detail empty">
          <p class="empty-message">コンテンツが選択されていません</p>
        </div>
      `;
    }
    
    const { content } = this.props;
    const visibilityText = content.visibility === 'public' ? '公開' : '非公開';
    const visibilityClass = content.visibility === 'public' ? 'public' : 'private';
    const markdownHtml = this.props.body ? this.renderMarkdown(this.props.body) : '';
    
    return `
      <div class="content-detail">
        <header>
          <h2>${content.title}</h2>
          <div class="meta">
            <span class="path">${content.path}</span>
            <span class="visibility ${visibilityClass}">${visibilityText}</span>
          </div>
          <div class="actions">
            <button class="edit-button">編集</button>
            <button class="delete-button">削除</button>
          </div>
        </header>
        <div class="content-body">
          <div class="markdown-content">
            ${markdownHtml}
          </div>
        </div>
        <footer>
          <div class="timestamps">
            <span class="created-at">作成日時: ${this.formatDate(content.createdAt)}</span>
            <span class="updated-at">更新日時: ${this.formatDate(content.updatedAt)}</span>
          </div>
        </footer>
      </div>
    `;
  }
} 