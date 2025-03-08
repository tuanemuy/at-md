/**
 * アプリケーションの状態管理
 * 
 * アプリケーション全体の状態を管理し、ページ遷移やデータの選択状態を制御します。
 */

// 表示可能なページの種類
export enum Page {
  HOME = "home",
  CONTENT_LIST = "content_list",
  CONTENT_DETAIL = "content_detail",
  CONTENT_EDIT = "content_edit",
  USER_LIST = "user_list",
  USER_DETAIL = "user_detail",
  USER_EDIT = "user_edit",
  FEED_LIST = "feed_list",
  FEED_DETAIL = "feed_detail",
  FEED_EDIT = "feed_edit",
}

// AppStateの初期化パラメータ
export interface AppStateParams {
  initialPage: Page;
  selectedContentId?: string;
  selectedUserId?: string;
  selectedFeedId?: string;
}

// 状態変更時のリスナー関数の型
type StateChangeListener = () => void;

/**
 * アプリケーションの状態を管理するクラス
 */
export class AppState {
  private currentPage: Page;
  private selectedContentId: string | undefined;
  private selectedUserId: string | undefined;
  private selectedFeedId: string | undefined;
  private listeners: StateChangeListener[] = [];

  constructor(params: AppStateParams) {
    this.currentPage = params.initialPage;
    this.selectedContentId = params.selectedContentId;
    this.selectedUserId = params.selectedUserId;
    this.selectedFeedId = params.selectedFeedId;
  }

  /**
   * 状態変更リスナーを追加
   */
  public addListener(listener: StateChangeListener): void {
    this.listeners.push(listener);
  }

  /**
   * 状態変更リスナーを削除
   */
  public removeListener(listener: StateChangeListener): void {
    this.listeners = this.listeners.filter(l => l !== listener);
  }

  /**
   * リスナーに状態変更を通知
   */
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener());
  }

  /**
   * 現在のページを取得
   */
  public getCurrentPage(): Page {
    return this.currentPage;
  }

  /**
   * 選択中のコンテンツIDを取得
   */
  public getSelectedContentId(): string | undefined {
    return this.selectedContentId;
  }

  /**
   * 選択中のユーザーIDを取得
   */
  public getSelectedUserId(): string | undefined {
    return this.selectedUserId;
  }

  /**
   * 選択中のフィードIDを取得
   */
  public getSelectedFeedId(): string | undefined {
    return this.selectedFeedId;
  }

  /**
   * ホームページに遷移
   */
  public navigateToHome(): void {
    this.currentPage = Page.HOME;
    this.notifyListeners();
  }

  /**
   * コンテンツ一覧ページに遷移
   */
  public navigateToContentList(): void {
    this.currentPage = Page.CONTENT_LIST;
    this.notifyListeners();
  }

  /**
   * コンテンツ詳細ページに遷移
   */
  public navigateToContentDetail(contentId: string): void {
    this.currentPage = Page.CONTENT_DETAIL;
    this.selectedContentId = contentId;
    this.notifyListeners();
  }

  /**
   * コンテンツ編集ページに遷移
   */
  public navigateToContentEdit(contentId?: string): void {
    this.currentPage = Page.CONTENT_EDIT;
    this.selectedContentId = contentId;
    this.notifyListeners();
  }

  /**
   * ユーザー一覧ページに遷移
   */
  public navigateToUserList(): void {
    this.currentPage = Page.USER_LIST;
    this.notifyListeners();
  }

  /**
   * ユーザー詳細ページに遷移
   */
  public navigateToUserDetail(userId: string): void {
    this.currentPage = Page.USER_DETAIL;
    this.selectedUserId = userId;
    this.notifyListeners();
  }

  /**
   * ユーザー編集ページに遷移
   */
  public navigateToUserEdit(userId?: string): void {
    this.currentPage = Page.USER_EDIT;
    this.selectedUserId = userId;
    this.notifyListeners();
  }

  /**
   * フィード一覧ページに遷移
   */
  public navigateToFeedList(): void {
    this.currentPage = Page.FEED_LIST;
    this.notifyListeners();
  }

  /**
   * フィード詳細ページに遷移
   */
  public navigateToFeedDetail(feedId: string): void {
    this.currentPage = Page.FEED_DETAIL;
    this.selectedFeedId = feedId;
    this.notifyListeners();
  }

  /**
   * フィード編集ページに遷移
   */
  public navigateToFeedEdit(feedId?: string): void {
    this.currentPage = Page.FEED_EDIT;
    this.selectedFeedId = feedId;
    this.notifyListeners();
  }

  /**
   * 状態を直接設定（ルーターなどの外部からの更新用）
   */
  public setState(page: Page, contentId?: string, userId?: string, feedId?: string): void {
    this.currentPage = page;
    
    if (contentId !== undefined) {
      this.selectedContentId = contentId;
    }
    
    if (userId !== undefined) {
      this.selectedUserId = userId;
    }
    
    if (feedId !== undefined) {
      this.selectedFeedId = feedId;
    }
    
    this.notifyListeners();
  }
} 