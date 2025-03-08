/**
 * コンテンツリスト表示コンポーネント
 * 
 * コンテンツのリスト表示機能を提供します。
 */

// コンテンツの型定義
export interface Content {
  id: string;
  title: string;
  path: string;
  visibility: string;
  createdAt: string;
  updatedAt: string;
}

// コンポーネントのプロパティ型定義
export interface ContentListProps {
  contents: Content[];
  onSelect: (id: string) => void;
  filter?: string;
  sortBy?: 'title' | 'path' | 'createdAt' | 'updatedAt';
  sortOrder?: 'asc' | 'desc';
}

/**
 * コンテンツリスト表示コンポーネント
 */
export class ContentList {
  private props: ContentListProps;
  
  /**
   * コンストラクタ
   * @param props コンポーネントのプロパティ
   */
  constructor(props: ContentListProps) {
    this.props = props;
  }
  
  /**
   * コンテンツアイテムのクリックハンドラ
   * @param id クリックされたコンテンツのID
   */
  public handleItemClick(id: string): void {
    this.props.onSelect(id);
  }
  
  /**
   * コンテンツをフィルタリングする
   * @returns フィルタリングされたコンテンツ配列
   */
  private filterContents(): Content[] {
    if (!this.props.filter) {
      return this.props.contents;
    }
    
    return this.props.contents.filter(content => 
      content.title.includes(this.props.filter || '') || 
      content.path.includes(this.props.filter || '')
    );
  }
  
  /**
   * コンテンツをソートする
   * @param contents ソート対象のコンテンツ配列
   * @returns ソートされたコンテンツ配列
   */
  private sortContents(contents: Content[]): Content[] {
    if (!this.props.sortBy) {
      return contents;
    }
    
    const { sortBy, sortOrder = 'asc' } = this.props;
    
    return [...contents].sort((a, b) => {
      const aValue = a[sortBy];
      const bValue = b[sortBy];
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
  }
  
  /**
   * コンポーネントをレンダリングする
   * @returns HTML文字列
   */
  public render(): string {
    const filteredContents = this.filterContents();
    const sortedContents = this.sortContents(filteredContents);
    
    if (sortedContents.length === 0) {
      return `
        <div class="content-list empty">
          <p class="empty-message">コンテンツがありません</p>
        </div>
      `;
    }
    
    const contentItems = sortedContents.map(content => {
      const visibilityText = content.visibility === 'public' ? '公開' : '非公開';
      const visibilityClass = content.visibility === 'public' ? 'public' : 'private';
      
      return `
        <li data-id="${content.id}" class="content-item">
          <h3>${content.title}</h3>
          <p class="path">${content.path}</p>
          <span class="visibility ${visibilityClass}">${visibilityText}</span>
        </li>
      `;
    }).join('');
    
    return `
      <div class="content-list">
        <ul>
          ${contentItems}
        </ul>
      </div>
    `;
  }
} 