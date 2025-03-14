import { expect, test, beforeEach, vi } from 'vitest';
import type { Logger } from '@/domain/shared/models/logger';
import { createAppContext, createMockContext, resetContext, getContext, initializeContext } from '../index';
import type { AppContext } from '../index';

// 各テストの前にコンテキストをリセット
beforeEach(() => {
  resetContext();
});

test('createAppContextが有効なコンテキストを作成すること', () => {
  const context = createAppContext();
  
  expect(context).toBeDefined();
  expect(context.logger).toBeDefined();
});

test('createMockContextでロガーをオーバーライドできること', () => {
  const mockLogger: Logger = {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn()
  };
  
  const context = createMockContext({ logger: mockLogger });
  
  expect(context.logger).toBe(mockLogger);
});

test('initializeContextがコンテキストを初期化すること', () => {
  const context = initializeContext();
  
  expect(context).toBeDefined();
  expect(context.logger).toBeDefined();
});

test('getContextが初期化されたコンテキストを返すこと', () => {
  // 初期化前に呼び出すと自動的に初期化される
  const context1 = getContext();
  expect(context1).toBeDefined();
  
  // 2回目の呼び出しでも同じインスタンスを返す
  const context2 = getContext();
  expect(context2).toBe(context1);
});

test('resetContextでコンテキストをリセットできること', () => {
  const context1 = getContext();
  resetContext();
  const context2 = getContext();
  
  expect(context2).not.toBe(context1);
}); 