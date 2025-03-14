import { type AppContext, createAppContext, createMockContext } from './container';

export { createAppContext, createMockContext };
export type { AppContext };

// アプリケーションコンテキストのシングルトンインスタンス
let appContext: AppContext | null = null;

/**
 * アプリケーションコンテキストを初期化する
 * @returns 初期化されたアプリケーションコンテキスト
 */
export function initializeContext(): AppContext {
  appContext = createAppContext();
  return appContext;
}

/**
 * アプリケーションコンテキストを取得する
 * 初期化されていない場合は自動的に初期化する
 * @returns アプリケーションコンテキスト
 */
export function getContext(): AppContext {
  if (!appContext) {
    return initializeContext();
  }
  return appContext;
}

/**
 * テスト用にコンテキストをリセットする
 */
export function resetContext(): void {
  appContext = null;
} 