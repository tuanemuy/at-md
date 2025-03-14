import type { Logger } from '@/domain/shared/models/logger';
import { getLogger } from '@/infrastructure/logger';

/**
 * アプリケーションコンテキスト
 * アプリケーション全体で使用する依存関係を保持する
 */
export interface AppContext {
  logger: Logger;
}

/**
 * アプリケーションコンテキストを作成する
 * @param options オプション
 * @returns アプリケーションコンテキスト
 */
export function createAppContext(options?: {
  logger?: Logger;
}): AppContext {
  return {
    logger: options?.logger || getLogger(),
  };
}

/**
 * テスト用のモックコンテキストを作成する
 * @param overrides オーバーライドする依存関係
 * @returns モックコンテキスト
 */
export function createMockContext(overrides?: Partial<AppContext>): AppContext {
  const defaultContext = createAppContext();
  return {
    ...defaultContext,
    ...overrides,
  };
} 