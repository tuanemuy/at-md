/**
 * フィード詳細表示コンポーネント
 * 
 * フィードの詳細表示機能を提供します。
 */

import { Feed } from "./feed-list.ts";

// 投稿の型定義
export interface Post {
  id: string;
  feedId: string;
  contentId: string;
  title: string;
  status: string;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// コンポーネントのプロパティ型定義
export interface FeedDetailProps {
  feed?: Feed;
  posts: Post[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onCreatePost: (feedId: string) => void;
  onEditPost: (postId: string) => void;
  onPublishPost: (postId: string) => void;
}

/**
 * フィード詳細表示コンポーネント
 */
export class FeedDetail {
  private props: FeedDetailProps;
  
  /**
   * コンストラクタ
   * @param props コンポーネントのプロパティ
   */
  constructor(props: FeedDetailProps) {
    this.props = props;
  }
  
  /**
   * 編集ボタンのクリックハンドラ
   */
  public handleEditClick(): void {
    if (this.props.feed) {
      this.props.onEdit(this.props.feed.id);
    }
  }
  
  /**
   * 削除ボタンのクリックハンドラ
   */
  public handleDeleteClick(): void {
    if (this.props.feed) {
      this.props.onDelete(this.props.feed.id);
    }
  }
  
  /**
   * 投稿作成ボタンのクリックハンドラ
   */
  public handleCreatePostClick(): void {
    if (this.props.feed) {
      this.props.onCreatePost(this.props.feed.id);
    }
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
   * 日時を整形する
   * @param dateString ISO形式の日時文字列
   * @returns 整形された日時文字列
   */
  private formatDate(dateString: string | null): string {
    if (!dateString) {
      return '未設定';
    }
    
    const date = new Date(dateString);
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  }
  
  /**
   * タグリストをHTML形式で生成する
   * @param tags タグ配列
   * @returns HTML文字列
   */
  private renderTags(tags: string[]): string {
    if (tags.length === 0) {
      return '';
    }
    
    const tagItems = tags.map(tag => `<span class="tag">${tag}</span>`).join('');
    
    return `<div class="tags">${tagItems}</div>`;
  }
  
  /**
   * 投稿リストをHTML形式で生成する
   * @param posts 投稿配列
   * @returns HTML文字列
   */
  private renderPosts(posts: Post[]): string {
    if (posts.length === 0) {
      return `
        <div class="posts-empty">
          <p class="empty-message">投稿がありません</p>
        </div>
      `;
    }
    
    const postItems = posts.map(post => {
      const statusText = post.status === 'published' ? '公開済' : '下書き';
      const statusClass = post.status === 'published' ? 'published' : 'draft';
      const publishButton = post.status === 'draft' 
        ? `<button class="publish-post-button" data-id="${post.id}">公開する</button>` 
        : '';
      
      return `
        <li data-id="${post.id}" class="post-item ${statusClass}">
          <div class="post-header">
            <h4>${post.title}</h4>
            <span class="status ${statusClass}">${statusText}</span>
          </div>
          <div class="post-meta">
            <span class="created-at">作成: ${this.formatDate(post.createdAt)}</span>
            <span class="updated-at">更新: ${this.formatDate(post.updatedAt)}</span>
            ${post.publishedAt ? `<span class="published-at">公開: ${this.formatDate(post.publishedAt)}</span>` : ''}
          </div>
          <div class="post-actions">
            <button class="edit-post-button" data-id="${post.id}">編集</button>
            ${publishButton}
          </div>
        </li>
      `;
    }).join('');
    
    return `
      <div class="posts">
        <h3>投稿一覧</h3>
        <ul class="post-list">
          ${postItems}
        </ul>
      </div>
    `;
  }
  
  /**
   * コンポーネントをレンダリングする
   * @returns HTML文字列
   */
  public render(): string {
    if (!this.props.feed) {
      return `
        <div class="feed-detail empty">
          <p class="empty-message">フィードが選択されていません</p>
        </div>
      `;
    }
    
    const { feed, posts } = this.props;
    const visibilityText = feed.isPublic ? '公開' : '非公開';
    const visibilityClass = feed.isPublic ? 'public' : 'private';
    const tags = this.renderTags(feed.tags);
    const postsHtml = this.renderPosts(posts);
    
    return `
      <div class="feed-detail">
        <header>
          <h2>${feed.name}</h2>
          <div class="meta">
            <span class="slug">/${feed.slug}</span>
            <span class="visibility ${visibilityClass}">${visibilityText}</span>
          </div>
          <div class="actions">
            <button class="edit-button">編集</button>
            <button class="delete-button">削除</button>
          </div>
        </header>
        
        <div class="feed-info">
          <p class="description">${feed.description}</p>
          ${tags}
        </div>
        
        <div class="feed-posts">
          <div class="posts-header">
            <h3>投稿</h3>
            <button class="create-post-button">投稿を作成</button>
          </div>
          ${postsHtml}
        </div>
        
        <footer>
          <div class="timestamps">
            <span class="created-at">作成日時: ${this.formatDate(feed.createdAt)}</span>
            <span class="updated-at">更新日時: ${this.formatDate(feed.updatedAt)}</span>
          </div>
        </footer>
      </div>
    `;
  }
} 