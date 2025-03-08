/**
 * フィード詳細ページコンポーネント
 * 
 * フィードの詳細を表示するページコンポーネントです。
 */

import { FeedDetail, FeedDetailProps } from "../components/feed-detail.ts";

// フィード詳細ページのプロパティ型定義
export interface FeedPageProps {
  feedDetailProps: FeedDetailProps;
  onBack: () => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onCreatePost: (feedId: string) => void;
  onEditPost: (postId: string) => void;
  onPublishPost: (postId: string) => void;
}

/**
 * フィード詳細ページコンポーネント
 */
export class FeedPage {
  private props: FeedPageProps;
  
  /**
   * コンストラクタ
   * @param props コンポーネントのプロパティ
   */
  constructor(props: FeedPageProps) {
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
   * @param id 編集するフィードのID
   */
  public handleEditClick(id: string): void {
    this.props.onEdit(id);
  }
  
  /**
   * 削除ボタンのクリックハンドラ
   * @param id 削除するフィードのID
   */
  public handleDeleteClick(id: string): void {
    this.props.onDelete(id);
  }
  
  /**
   * 投稿作成ボタンのクリックハンドラ
   * @param feedId 投稿を作成するフィードのID
   */
  public handleCreatePostClick(feedId: string): void {
    this.props.onCreatePost(feedId);
  }
  
  /**
   * 投稿編集ボタンのクリックハンドラ
   * @param postId 編集する投稿のID
   */
  public handleEditPostClick(postId: string): void {
    this.props.onEditPost(postId);
  }
  
  /**
   * 投稿公開ボタンのクリックハンドラ
   * @param postId 公開する投稿のID
   */
  public handlePublishPostClick(postId: string): void {
    this.props.onPublishPost(postId);
  }
  
  /**
   * コンポーネントをレンダリングする
   * @returns HTML文字列
   */
  public render(): string {
    // フィード詳細コンポーネントのインスタンスを作成
    const feedDetail = new FeedDetail({
      ...this.props.feedDetailProps,
      onEdit: (id) => this.handleEditClick(id),
      onDelete: (id) => this.handleDeleteClick(id),
      onCreatePost: (feedId) => this.handleCreatePostClick(feedId),
      onEditPost: (postId) => this.handleEditPostClick(postId),
      onPublishPost: (postId) => this.handlePublishPostClick(postId)
    });
    
    // フィード詳細をレンダリング
    const feedDetailHtml = feedDetail.render();
    
    // フィード詳細ページのHTMLを構築
    return `
      <div class="feed-page">
        <header class="page-header">
          <button class="back-button" id="back-button">← 戻る</button>
          <h1>フィード詳細</h1>
        </header>
        
        <div class="feed-container">
          ${feedDetailHtml}
        </div>
      </div>
    `;
  }
} 