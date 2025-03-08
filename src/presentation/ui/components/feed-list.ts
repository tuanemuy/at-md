/**
 * フィードリスト表示コンポーネント
 * 
 * フィードのリスト表示機能を提供します。
 */

// フィードの型定義
export interface Feed {
  id: string;
  userId: string;
  name: string;
  slug: string;
  description: string;
  tags: string[];
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

// コンポーネントのプロパティ型定義
export interface FeedListProps {
  feeds: Feed[];
  onSelect: (id: string) => void;
  filter?: string;
  tagFilter?: string;
  publicFilter?: boolean;
  sortBy?: 'name' | 'slug' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

/**
 * フィードリスト表示コンポーネント
 */
export class FeedList {
  private props: FeedListProps;
  
  /**
   * コンストラクタ
   * @param props コンポーネントのプロパティ
   */
  constructor(props: FeedListProps) {
    this.props = props;
  }
  
  /**
   * フィードアイテムのクリックハンドラ
   * @param id クリックされたフィードのID
   */
  public handleItemClick(id: string): void {
    this.props.onSelect(id);
  }
  
  /**
   * フィードをフィルタリングする
   * @returns フィルタリングされたフィード配列
   */
  public filterFeeds(): Feed[] {
    let filteredFeeds = this.props.feeds;
    
    // テキストフィルタリング
    if (this.props.filter) {
      filteredFeeds = filteredFeeds.filter(feed => 
        feed.name.includes(this.props.filter || '') || 
        feed.slug.includes(this.props.filter || '') ||
        feed.description.includes(this.props.filter || '')
      );
    }
    
    // タグフィルタリング
    if (this.props.tagFilter) {
      filteredFeeds = filteredFeeds.filter(feed => 
        feed.tags.some(tag => tag.includes(this.props.tagFilter || ''))
      );
    }
    
    // 公開状態フィルタリング
    if (this.props.publicFilter !== undefined) {
      filteredFeeds = filteredFeeds.filter(feed => 
        feed.isPublic === this.props.publicFilter
      );
    }
    
    return filteredFeeds;
  }
  
  /**
   * フィードをソートする
   * @param feeds ソート対象のフィード配列
   * @returns ソートされたフィード配列
   */
  public sortFeeds(feeds: Feed[]): Feed[] {
    if (!this.props.sortBy) {
      return feeds;
    }
    
    const { sortBy, sortOrder = 'asc' } = this.props;
    
    return [...feeds].sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];
      
      // 文字列の場合は大文字小文字を区別しない
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
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
   * コンポーネントをレンダリングする
   * @returns HTML文字列
   */
  public render(): string {
    const filteredFeeds = this.filterFeeds();
    const sortedFeeds = this.sortFeeds(filteredFeeds);
    
    if (sortedFeeds.length === 0) {
      return `
        <div class="feed-list empty">
          <p class="empty-message">フィードがありません</p>
        </div>
      `;
    }
    
    const feedItems = sortedFeeds.map(feed => {
      const visibilityText = feed.isPublic ? '公開' : '非公開';
      const visibilityClass = feed.isPublic ? 'public' : 'private';
      const tags = this.renderTags(feed.tags);
      
      return `
        <li data-id="${feed.id}" class="feed-item">
          <div class="feed-header">
            <h3>${feed.name}</h3>
            <span class="slug">/${feed.slug}</span>
            <span class="visibility ${visibilityClass}">${visibilityText}</span>
          </div>
          <div class="feed-body">
            <p class="description">${feed.description}</p>
            ${tags}
          </div>
        </li>
      `;
    }).join('');
    
    return `
      <div class="feed-list">
        <ul>
          ${feedItems}
        </ul>
      </div>
    `;
  }
} 