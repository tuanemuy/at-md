import { expect, test, vi } from 'vitest';
import { LogLevel } from '@/domain/shared/models/logger';
import { WinstonLogger } from '../winston-logger';
import { getLogger, initLogger } from '../index';

// モック
vi.mock('winston', async () => {
  const mockLogger = {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  };
  
  return {
    default: {
      createLogger: vi.fn(() => mockLogger),
      format: {
        timestamp: vi.fn(() => ({})),
        json: vi.fn(() => ({})),
        combine: vi.fn((...args) => args),
        colorize: vi.fn(() => ({})),
        simple: vi.fn(() => ({})),
      },
      transports: {
        Console: class {},
      },
    },
    createLogger: vi.fn(() => mockLogger),
    format: {
      timestamp: vi.fn(() => ({})),
      json: vi.fn(() => ({})),
      combine: vi.fn((...args) => args),
      colorize: vi.fn(() => ({})),
      simple: vi.fn(() => ({})),
    },
    transports: {
      Console: class {},
    },
  };
});

test('WinstonLoggerがLoggerインターフェースを実装していること', () => {
  const logger = new WinstonLogger();
  
  expect(logger.error).toBeInstanceOf(Function);
  expect(logger.warn).toBeInstanceOf(Function);
  expect(logger.info).toBeInstanceOf(Function);
  expect(logger.debug).toBeInstanceOf(Function);
});

test('initLoggerが正しくロガーを初期化すること', () => {
  const logger = initLogger({ level: LogLevel.DEBUG, silent: true });
  
  expect(logger).toBeDefined();
  expect(logger.error).toBeInstanceOf(Function);
  expect(logger.warn).toBeInstanceOf(Function);
  expect(logger.info).toBeInstanceOf(Function);
  expect(logger.debug).toBeInstanceOf(Function);
});

test('getLoggerが初期化されたロガーを返すこと', () => {
  // 初期化
  initLogger({ level: LogLevel.DEBUG, silent: true });
  
  // 取得
  const logger = getLogger();
  
  expect(logger).toBeDefined();
  expect(logger.error).toBeInstanceOf(Function);
  expect(logger.warn).toBeInstanceOf(Function);
  expect(logger.info).toBeInstanceOf(Function);
  expect(logger.debug).toBeInstanceOf(Function);
}); 