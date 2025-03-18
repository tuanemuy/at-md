import { expect, test, vi, describe, beforeEach, afterEach } from "vitest";
import { Logger, logger } from "../logger";

// Loggerをテストするためにwinstonへの呼び出しをモック化
vi.mock("winston", () => {
  const mockLoggerInstance = {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
    log: vi.fn()
  };
  
  return {
    createLogger: vi.fn(() => mockLoggerInstance),
    format: {
      combine: vi.fn(),
      timestamp: vi.fn(),
      errors: vi.fn(),
      splat: vi.fn(),
      json: vi.fn(),
      colorize: vi.fn(),
      printf: vi.fn()
    },
    transports: {
      Console: vi.fn(),
      File: vi.fn()
    }
  };
});

describe("Logger", () => {
  // テスト実行前にスパイをリセット
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // テスト終了後にモックをリストア
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("loggerがシングルトンインスタンスであること", () => {
    // グローバルなloggerインスタンスを取得
    const instance1 = logger;
    // 新たにgetInstanceで取得
    const instance2 = Logger.getInstance();

    // 同じインスタンスを指していること
    expect(instance1).toBe(instance2);
  });

  test("error()が正しいレベルでログを出力すること", () => {
    const message = "エラーが発生しました";
    const meta = { errorCode: "E001", context: "テスト" };
    
    // プライベートプロパティにアクセスするためにanyにキャスト
    const loggerInstance = logger as any;
    const loggerSpy = vi.spyOn(loggerInstance.logger, "error");
    
    // ログ出力
    logger.error(message, meta);
    
    // errorメソッドが正しく呼ばれたことを確認
    expect(loggerSpy).toHaveBeenCalledTimes(1);
    expect(loggerSpy).toHaveBeenCalledWith(message, meta);
  });

  test("warn()が正しいレベルでログを出力すること", () => {
    const message = "警告が発生しました";
    const meta = { warningCode: "W001", context: "テスト" };
    
    const loggerInstance = logger as any;
    const loggerSpy = vi.spyOn(loggerInstance.logger, "warn");
    
    logger.warn(message, meta);
    
    expect(loggerSpy).toHaveBeenCalledTimes(1);
    expect(loggerSpy).toHaveBeenCalledWith(message, meta);
  });

  test("info()が正しいレベルでログを出力すること", () => {
    const message = "情報を記録します";
    const meta = { operation: "テスト実行", user: "テストユーザー" };
    
    const loggerInstance = logger as any;
    const loggerSpy = vi.spyOn(loggerInstance.logger, "info");
    
    logger.info(message, meta);
    
    expect(loggerSpy).toHaveBeenCalledTimes(1);
    expect(loggerSpy).toHaveBeenCalledWith(message, meta);
  });

  test("debug()が正しいレベルでログを出力すること", () => {
    const message = "デバッグ情報";
    const meta = { debugData: { key: "value" } };
    
    const loggerInstance = logger as any;
    const loggerSpy = vi.spyOn(loggerInstance.logger, "debug");
    
    logger.debug(message, meta);
    
    expect(loggerSpy).toHaveBeenCalledTimes(1);
    expect(loggerSpy).toHaveBeenCalledWith(message, meta);
  });

  test("log()が指定されたレベルでログを出力すること", () => {
    const message = "カスタムレベルのログ";
    const meta = { custom: true };
    const level = "info";
    
    const loggerInstance = logger as any;
    const loggerSpy = vi.spyOn(loggerInstance.logger, "log");
    
    logger.log(level, message, meta);
    
    expect(loggerSpy).toHaveBeenCalledTimes(1);
    expect(loggerSpy).toHaveBeenCalledWith(level, message, meta);
  });
}); 