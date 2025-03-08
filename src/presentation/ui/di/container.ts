/**
 * 依存性注入コンテナ
 * 
 * アプリケーションの依存関係を管理するためのDIコンテナです。
 * シングルトンパターンを使用して、アプリケーション全体で一貫したインスタンスを提供します。
 */

import { IAppState, AppState, AppStateProps, Page } from "../state/app-state.ts";
import { IRouter, Router } from "../router/router.ts";

/**
 * DIコンテナインターフェース
 */
export interface IDIContainer {
  /**
   * AppStateインスタンスを取得
   * @returns AppStateインスタンス
   */
  getAppState(): IAppState;

  /**
   * Routerインスタンスを取得
   * @returns Routerインスタンス
   */
  getRouter(): IRouter;
}

/**
 * DIコンテナの実装
 */
export class DIContainer implements IDIContainer {
  private static instance: DIContainer;
  private appState: IAppState;
  private router: IRouter;

  /**
   * プライベートコンストラクタ
   * @param appStateProps AppStateの初期化パラメータ
   * @param window ウィンドウオブジェクト
   */
  private constructor(
    appStateProps: AppStateProps = { initialPage: Page.HOME },
    window: Window = globalThis.window
  ) {
    // AppStateの初期化
    this.appState = new AppState(appStateProps);
    
    // Routerの初期化
    this.router = new Router(this.appState, window);
  }

  /**
   * DIコンテナのインスタンスを取得
   * @param appStateProps AppStateの初期化パラメータ
   * @param window ウィンドウオブジェクト
   * @returns DIコンテナのインスタンス
   */
  public static getInstance(
    appStateProps?: AppStateProps,
    window?: Window
  ): DIContainer {
    if (!DIContainer.instance) {
      DIContainer.instance = new DIContainer(appStateProps, window);
    }
    return DIContainer.instance;
  }

  /**
   * DIコンテナをリセット
   * テスト用のメソッド
   */
  public static reset(): void {
    DIContainer.instance = undefined as unknown as DIContainer;
  }

  /**
   * AppStateインスタンスを取得
   * @returns AppStateインスタンス
   */
  getAppState(): IAppState {
    return this.appState;
  }

  /**
   * Routerインスタンスを取得
   * @returns Routerインスタンス
   */
  getRouter(): IRouter {
    return this.router;
  }
} 