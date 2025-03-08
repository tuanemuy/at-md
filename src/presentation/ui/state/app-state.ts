/**
 * アプリケーション状態管理
 * 
 * アプリケーション全体の状態を管理するクラスです。
 * ページの遷移や選択中のコンテンツID、ユーザーIDなどを管理します。
 */

/**
 * アプリケーションのページ種別
 */
export enum Page {
  HOME = "home",
  CONTENT_DETAIL = "content-detail",
  CONTENT_EDIT = "content-edit",
  USER_DETAIL = "user-detail",
  USER_EDIT = "user-edit",
  FEED_DETAIL = "feed-detail",
  FEED_EDIT = "feed-edit",
  SETTINGS = "settings",
}

/**
 * AppStateの初期化パラメータ
 */
export interface AppStateProps {
  initialPage: Page;
  initialContentId?: string;
  initialUserId?: string;
  initialFeedId?: string;
}

/**
 * 状態変更リスナー
 */
export type StateChangeListener = () => void;

/**
 * アプリケーション状態管理クラス
 */
export class AppState {
  private currentPage: Page;
  private selectedContentId?: string;
  private selectedUserId?: string;
  private selectedFeedId?: string;
  private listeners: StateChangeListener[] = [];

  /**
   * コンストラクタ
   * @param props 初期化パラメータ
   */
  constructor(props: AppStateProps) {
    this.currentPage = props.initialPage;
    this.selectedContentId = props.initialContentId;
    this.selectedUserId = props.initialUserId;
    this.selectedFeedId = props.initialFeedId;
  }

  /**
   * 現在のページを取得
   * @returns 現在のページ
   */
  getCurrentPage(): Page {
    return this.currentPage;
  }

  /**
   * 選択中のコンテンツIDを取得
   * @returns 選択中のコンテンツID
   */
  getSelectedContentId(): string | undefined {
    return this.selectedContentId;
  }

  /**
   * 選択中のユーザーIDを取得
   * @returns 選択中のユーザーID
   */
  getSelectedUserId(): string | undefined {
    return this.selectedUserId;
  }

  /**
   * 選択中のフィードIDを取得
   * @returns 選択中のフィードID
   */
  getSelectedFeedId(): string | undefined {
    return this.selectedFeedId;
  }

  /**
   * 状態を設定
   * @param page ページ
   * @param contentId コンテンツID
   * @param userId ユーザーID
   * @param feedId フィードID
   */
  setState(
    page: Page,
    contentId?: string,
    userId?: string,
    feedId?: string
  ): void {
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

  /**
   * コンテンツ詳細ページに遷移
   * @param contentId コンテンツID
   */
  navigateToContentDetail(contentId: string): void {
    this.setState(Page.CONTENT_DETAIL, contentId);
  }

  /**
   * ユーザー詳細ページに遷移
   * @param userId ユーザーID
   */
  navigateToUserDetail(userId: string): void {
    this.setState(Page.USER_DETAIL, undefined, userId);
  }

  /**
   * フィード詳細ページに遷移
   * @param feedId フィードID
   */
  navigateToFeedDetail(feedId: string): void {
    this.setState(Page.FEED_DETAIL, undefined, undefined, feedId);
  }

  /**
   * ホームページに遷移
   */
  navigateToHome(): void {
    this.setState(Page.HOME);
  }

  /**
   * 状態変更リスナーを追加
   * @param listener リスナー関数
   */
  addListener(listener: StateChangeListener): void {
    this.listeners.push(listener);
  }

  /**
   * 状態変更リスナーを削除
   * @param listener 削除するリスナー関数
   */
  removeListener(listener: StateChangeListener): void {
    this.listeners = this.listeners.filter(l => l !== listener);
  }

  /**
   * すべてのリスナーに通知
   */
  private notifyListeners(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }
} 