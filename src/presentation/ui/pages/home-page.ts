/**
 * ホームページコンポーネント
 * 
 * アプリケーションのホームページを表示するコンポーネントです。
 */

import { ContentList, ContentListProps } from "../components/content-list.ts";
import { UserList, UserListProps } from "../components/user-list.ts";
import { FeedList, FeedListProps } from "../components/feed-list.ts";

// ホームページのプロパティ型定義
export interface HomePageProps {
  contentListProps: ContentListProps;
  userListProps: UserListProps;
  feedListProps: FeedListProps;
  onContentSelect: (id: string) => void;
  onUserSelect: (id: string) => void;
  onFeedSelect: (id: string) => void;
}

/**
 * ホームページコンポーネント
 */
export class HomePage {
  private props: HomePageProps;
  
  /**
   * コンストラクタ
   * @param props コンポーネントのプロパティ
   */
  constructor(props: HomePageProps) {
    this.props = props;
  }
  
  /**
   * コンテンツ選択ハンドラ
   * @param id 選択されたコンテンツのID
   */
  public handleContentSelect(id: string): void {
    this.props.onContentSelect(id);
  }
  
  /**
   * ユーザー選択ハンドラ
   * @param id 選択されたユーザーのID
   */
  public handleUserSelect(id: string): void {
    this.props.onUserSelect(id);
  }
  
  /**
   * フィード選択ハンドラ
   * @param id 選択されたフィードのID
   */
  public handleFeedSelect(id: string): void {
    this.props.onFeedSelect(id);
  }
  
  /**
   * コンポーネントをレンダリングする
   * @returns HTML文字列
   */
  public render(): string {
    // 各リストコンポーネントのインスタンスを作成
    const contentList = new ContentList({
      ...this.props.contentListProps,
      onSelect: (id) => this.handleContentSelect(id)
    });
    
    const userList = new UserList({
      ...this.props.userListProps,
      onSelect: (id) => this.handleUserSelect(id)
    });
    
    const feedList = new FeedList({
      ...this.props.feedListProps,
      onSelect: (id) => this.handleFeedSelect(id)
    });
    
    // 各コンポーネントをレンダリング
    const contentListHtml = contentList.render();
    const userListHtml = userList.render();
    const feedListHtml = feedList.render();
    
    // ホームページのHTMLを構築
    return `
      <div class="home-page">
        <header class="page-header">
          <h1>AT-MD ダッシュボード</h1>
        </header>
        
        <div class="dashboard-grid">
          <section class="dashboard-section content-section">
            <h2>コンテンツ</h2>
            ${contentListHtml}
          </section>
          
          <section class="dashboard-section user-section">
            <h2>ユーザー</h2>
            ${userListHtml}
          </section>
          
          <section class="dashboard-section feed-section">
            <h2>フィード</h2>
            ${feedListHtml}
          </section>
        </div>
      </div>
    `;
  }
} 