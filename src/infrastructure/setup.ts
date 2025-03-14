import { initializeContext, getContext } from './di';
import type { AppContext } from './di';
import type { Logger } from '@/domain/shared/models/logger';

/**
 * アプリケーションの初期化
 * @returns アプリケーションコンテキスト
 */
export function setupApplication(): AppContext {
  // アプリケーションコンテキストの初期化
  const context = initializeContext();
  
  // ロガーの使用例
  context.logger.info('アプリケーションを初期化しました');
  
  return context;
}

/**
 * 現在のアプリケーションコンテキストを取得
 * @returns アプリケーションコンテキスト
 */
export function getApplicationContext(): AppContext {
  return getContext();
}

export default setupApplication; 