/**
 * アプリケーション状態管理
 * 
 * アプリケーション全体の状態を管理します。
 */

// ページの種類を定義
export enum Page {
  HOME = "home",
  CONTENT_DETAIL = "content_detail",
  USER_DETAIL = "user_detail",
  FEED_DETAIL = "feed_detail",
}

// 状態変更リスナーの型定義
export type StateChangeListener = () => void;

// アプリケーション状態のプロパティ型定義
export interface AppStateProps {
  initialPage: Page;
}

/**
 * アプリケーション状態管理クラス
 */
export class AppState {
  private currentPage: Page;
  private selectedContentId: string | null = null;
  private selectedUserId: string | null = null;
  private selectedFeedId: string | null = null;
  private listeners: StateChangeListener[] = [];
  
  /**
   * コンストラクタ
   * @param props アプリケーション状態のプロパティ
   */
  constructor(props: AppStateProps) {
    this.currentPage = props.initialPage;
  }
  
  /**
   * 現在のページを取得する
   * @returns 現在のページ
   */
  public getCurrentPage(): Page {
    return this.currentPage;
  }
  
  /**
   * 現在のページを設定する
   * @param page 設定するページ
   */
  public setCurrentPage(page: Page): void {
    this.currentPage = page;
    this.notifyListeners();
  }
  
  /**
   * 選択中のコンテンツIDを取得する
   * @returns 選択中のコンテンツID
   */
  public getSelectedContentId(): string | null {
    return this.selectedContentId;
  }
  
  /**
   * 選択中のコンテンツIDを設定する
   * @param id 設定するコンテンツID
   */
  public setSelectedContentId(id: string | null): void {
    this.selectedContentId = id;
    this.notifyListeners();
  }
  
  /**
   * 選択中のユーザーIDを取得する
   * @returns 選択中のユーザーID
   */
  public getSelectedUserId(): string | null {
    return this.selectedUserId;
  }
  
  /**
   * 選択中のユーザーIDを設定する
   * @param id 設定するユーザーID
   */
  public setSelectedUserId(id: string | null): void {
    this.selectedUserId = id;
    this.notifyListeners();
  }
  
  /**
   * 選択中のフィードIDを取得する
   * @returns 選択中のフィードID
   */
  public getSelectedFeedId(): string | null {
    return this.selectedFeedId;
  }
  
  /**
   * 選択中のフィードIDを設定する
   * @param id 設定するフィードID
   */
  public setSelectedFeedId(id: string | null): void {
    this.selectedFeedId = id;
    this.notifyListeners();
  }
  
  /**
   * ホームページに遷移する
   */
  public navigateToHome(): void {
    this.setCurrentPage(Page.HOME);
  }
  
  /**
   * コンテンツ詳細ページに遷移する
   * @param contentId コンテンツID
   */
  public navigateToContentDetail(contentId: string): void {
    this.setSelectedContentId(contentId);
    this.setCurrentPage(Page.CONTENT_DETAIL);
  }
  
  /**
   * ユーザー詳細ページに遷移する
   * @param userId ユーザーID
   */
  public navigateToUserDetail(userId: string): void {
    this.setSelectedUserId(userId);
    this.setCurrentPage(Page.USER_DETAIL);
  }
  
  /**
   * フィード詳細ページに遷移する
   * @param feedId フィードID
   */
  public navigateToFeedDetail(feedId: string): void {
    this.setSelectedFeedId(feedId);
    this.setCurrentPage(Page.FEED_DETAIL);
  }
  
  /**
   * 状態変更リスナーを追加する
   * @param listener 追加するリスナー
   */
  public addChangeListener(listener: StateChangeListener): void {
    this.listeners.push(listener);
  }
  
  /**
   * 状態変更リスナーを削除する
   * @param listener 削除するリスナー
   */
  public removeChangeListener(listener: StateChangeListener): void {
    this.listeners = this.listeners.filter(l => l !== listener);
  }
  
  /**
   * すべてのリスナーに状態変更を通知する
   */
  private notifyListeners(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }
} 