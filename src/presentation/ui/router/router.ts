/**
 * URLベースのルーティング
 * 
 * アプリケーションの状態とURLを同期させるルーターです。
 * ブラウザのURLに基づいて適切なページを表示し、
 * 状態が変更されたときにURLを更新します。
 */

import { IAppState, Page } from "../state/app-state.ts";

/**
 * ルーターインターフェース
 */
export interface IRouter {
  /**
   * ルーターを開始
   * URLの変更を監視し、状態の変更を監視します
   */
  start(): void;

  /**
   * ルーターを停止
   * URLと状態の同期を停止します
   */
  stop(): void;
}

/**
 * URLルーティングを管理するクラス
 */
export class Router implements IRouter {
  private appState: IAppState;
  private window: Window;
  private isRunning = false;

  /**
   * コンストラクタ
   * @param appState アプリケーション状態
   * @param window ウィンドウオブジェクト
   */
  constructor(appState: IAppState, window: Window = globalThis.window) {
    this.appState = appState;
    this.window = window;
  }

  /**
   * ルーターを開始
   * URLの変更を監視し、状態の変更を監視します
   */
  start(): void {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;

    // 現在のURLに基づいて初期状態を設定
    // URLが空の場合（"/"のみの場合）は、初期状態を維持する
    const pathname = this.window.location.pathname;
    const search = this.window.location.search;
    if (pathname !== "/" || search !== "") {
      this.syncStateFromUrl();
    }

    // 状態変更時にURLを更新するリスナーを追加
    this.appState.addListener(this.syncUrlFromState.bind(this));

    // ブラウザの戻る/進むボタンでURLが変更されたときに状態を更新
    this.window.addEventListener("popstate", this.handlePopState.bind(this));
  }

  /**
   * ルーターを停止
   * URLと状態の同期を停止します
   */
  stop(): void {
    if (!this.isRunning) {
      return;
    }

    this.isRunning = false;

    // リスナーを削除
    this.window.removeEventListener("popstate", this.handlePopState.bind(this));
  }

  /**
   * popstateイベントハンドラ
   * ブラウザの戻る/進むボタンが押されたときに呼ばれます
   */
  private handlePopState(): void {
    this.syncStateFromUrl();
  }

  /**
   * 現在のURLに基づいて状態を更新
   */
  private syncStateFromUrl(): void {
    const pathname = this.window.location.pathname;
    const searchParams = new URLSearchParams(this.window.location.search);
    const id = searchParams.get("id");

    switch (pathname) {
      case "/":
        this.appState.setState(Page.HOME);
        break;
      case "/content":
        if (id) {
          this.appState.setState(Page.CONTENT_DETAIL, id);
        } else {
          this.appState.setState(Page.HOME);
        }
        break;
      case "/user":
        if (id) {
          this.appState.setState(Page.USER_DETAIL, undefined, id);
        } else {
          this.appState.setState(Page.HOME);
        }
        break;
      case "/feed":
        if (id) {
          this.appState.setState(Page.FEED_DETAIL, undefined, undefined, id);
        } else {
          this.appState.setState(Page.HOME);
        }
        break;
      default:
        // 未知のパスの場合はホームページに遷移
        this.appState.setState(Page.HOME);
        break;
    }
  }

  /**
   * 現在の状態に基づいてURLを更新
   */
  private syncUrlFromState(): void {
    if (!this.isRunning) {
      return;
    }

    const page = this.appState.getCurrentPage();
    let url = "/";

    switch (page) {
      case Page.HOME:
        url = "/";
        break;
      case Page.CONTENT_DETAIL:
        const contentId = this.appState.getSelectedContentId();
        url = `/content?id=${contentId}`;
        break;
      case Page.USER_DETAIL:
        const userId = this.appState.getSelectedUserId();
        url = `/user?id=${userId}`;
        break;
      case Page.FEED_DETAIL:
        const feedId = this.appState.getSelectedFeedId();
        url = `/feed?id=${feedId}`;
        break;
      default:
        url = "/";
        break;
    }

    // URLを更新（履歴に追加）
    // @ts-ignore: Window型にhistoryプロパティが存在することを保証
    this.window.history.pushState({}, "", url);
  }
} 