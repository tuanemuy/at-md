/**
 * UIアプリケーション
 * 
 * UIアプリケーションのエントリーポイントです。
 * DIコンテナを使用して、依存関係を管理します。
 */

import { DIContainer } from "./di/container.ts";
import { AppStateProps, Page } from "./state/app-state.ts";

/**
 * UIアプリケーションを初期化する
 * @param appStateProps AppStateの初期化パラメータ
 * @param window ウィンドウオブジェクト
 */
export function initializeUI(
  appStateProps: AppStateProps = { initialPage: Page.HOME },
  window: Window = globalThis.window
): void {
  // DIコンテナを初期化
  const container = DIContainer.getInstance(appStateProps, window);
  
  // ルーターを開始
  const router = container.getRouter();
  router.start();
  
  // アプリケーションの初期化が完了したことをログに出力
  console.info("UIアプリケーションが初期化されました");
}

/**
 * UIアプリケーションを終了する
 */
export function terminateUI(): void {
  // DIコンテナを取得
  const container = DIContainer.getInstance();
  
  // ルーターを停止
  const router = container.getRouter();
  router.stop();
  
  // DIコンテナをリセット
  DIContainer.reset();
  
  // アプリケーションの終了が完了したことをログに出力
  console.info("UIアプリケーションが終了しました");
} 