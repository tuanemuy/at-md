/**
 * ルーター
 * 
 * URLとアプリケーション状態を同期するためのルーターを提供します。
 */

import { AppState, Page } from "../state/app-state.ts";

// ルートの定義
export interface Route {
  path: string;
  page: Page;
}

// ルーターの初期化パラメータ
export interface RouterParams {
  appState: AppState;
  routes: Route[];
}

/**
 * URLとアプリケーション状態を同期するルーター
 */
export class Router {
  private appState: AppState;
  private routes: Route[];
  private isStarted: boolean = false;
  private popStateHandler: (event: PopStateEvent) => void;

  constructor(params: RouterParams) {
    this.appState = params.appState;
    this.routes = params.routes;
    
    // popstateイベントのハンドラを定義
    this.popStateHandler = (_event: PopStateEvent) => {
      this.syncStateFromUrl();
    };
  }

  /**
   * ルーターを開始
   */
  public start(): void {
    if (this.isStarted) {
      return;
    }
    
    // 初期状態をURLから同期
    this.syncStateFromUrl();
    
    // アプリケーション状態の変更を監視
    this.appState.addListener(() => {
      this.syncUrlFromState();
    });
    
    // ブラウザの戻る/進むボタンの操作を監視
    window.addEventListener("popstate", this.popStateHandler);
    
    this.isStarted = true;
  }

  /**
   * ルーターを停止
   */
  public stop(): void {
    if (!this.isStarted) {
      return;
    }
    
    // イベントリスナーを削除
    window.removeEventListener("popstate", this.popStateHandler);
    
    this.isStarted = false;
  }

  /**
   * URLからアプリケーション状態を同期
   */
  private syncStateFromUrl(): void {
    const pathname = window.location.pathname;
    
    // パスに一致するルートを検索
    for (const route of this.routes) {
      const match = this.matchRoute(route.path, pathname);
      
      if (match) {
        // ルートに一致した場合、状態を更新
        switch (route.page) {
          case Page.HOME:
            this.appState.setState(Page.HOME);
            break;
            
          case Page.CONTENT_DETAIL:
            this.appState.setState(Page.CONTENT_DETAIL, match.params.id);
            break;
            
          case Page.USER_DETAIL:
            this.appState.setState(Page.USER_DETAIL, undefined, match.params.id);
            break;
            
          case Page.FEED_DETAIL:
            this.appState.setState(Page.FEED_DETAIL, undefined, undefined, match.params.id);
            break;
            
          default:
            this.appState.setState(route.page);
            break;
        }
        
        return;
      }
    }
    
    // 一致するルートがない場合はホームページに遷移
    this.appState.setState(Page.HOME);
  }

  /**
   * アプリケーション状態からURLを同期
   */
  private syncUrlFromState(): void {
    const currentPage = this.appState.getCurrentPage();
    let url = "/";
    
    // 現在のページに応じてURLを設定
    switch (currentPage) {
      case Page.HOME:
        url = "/";
        break;
        
      case Page.CONTENT_DETAIL:
        const contentId = this.appState.getSelectedContentId();
        if (contentId) {
          url = `/content/${contentId}`;
        }
        break;
        
      case Page.USER_DETAIL:
        const userId = this.appState.getSelectedUserId();
        if (userId) {
          url = `/user/${userId}`;
        }
        break;
        
      case Page.FEED_DETAIL:
        const feedId = this.appState.getSelectedFeedId();
        if (feedId) {
          url = `/feed/${feedId}`;
        }
        break;
        
      default:
        url = "/";
        break;
    }
    
    // 現在のURLと異なる場合のみ更新
    if (window.location.pathname !== url) {
      window.history.pushState({}, "", url);
    }
  }

  /**
   * ルートパターンとURLパスのマッチングを行う
   */
  private matchRoute(pattern: string, path: string): { params: Record<string, string> } | null {
    // パターンとパスをセグメントに分割
    const patternSegments = pattern.split("/").filter(segment => segment !== "");
    const pathSegments = path.split("/").filter(segment => segment !== "");
    
    // セグメント数が異なる場合はマッチしない
    if (patternSegments.length !== pathSegments.length) {
      return null;
    }
    
    const params: Record<string, string> = {};
    
    // 各セグメントを比較
    for (let i = 0; i < patternSegments.length; i++) {
      const patternSegment = patternSegments[i];
      const pathSegment = pathSegments[i];
      
      // パラメータセグメント（:で始まる）の場合
      if (patternSegment.startsWith(":")) {
        const paramName = patternSegment.substring(1);
        params[paramName] = pathSegment;
      } 
      // 通常のセグメントの場合
      else if (patternSegment !== pathSegment) {
        return null;
      }
    }
    
    return { params };
  }
} 