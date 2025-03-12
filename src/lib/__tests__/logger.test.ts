import { expect, test, vi, beforeEach, afterEach } from "vitest";
import { getLogger, Logger } from "../logger";

beforeEach(() => {
  // テスト中はSKIP_LOGを無効にする
  process.env.SKIP_LOG = "false";

  // コンソールメソッドのモック化
  vi.spyOn(console, "debug").mockImplementation(() => {});
  vi.spyOn(console, "info").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  // 環境変数を元に戻す
  process.env.SKIP_LOG = "true";

  // モックのリセット
  vi.restoreAllMocks();
});

test("開発環境でのロガーがすべてのログレベルを出力すること", () => {
  // 開発環境を模倣
  vi.stubEnv("NODE_ENV", "development");

  const logger = getLogger();

  logger.debug("Debug message");
  logger.info("Info message");
  logger.warn("Warn message");
  logger.error("Error message");

  expect(console.debug).toHaveBeenCalledWith("[DEBUG] Debug message");
  expect(console.info).toHaveBeenCalledWith("[INFO] Info message");
  expect(console.warn).toHaveBeenCalledWith("[WARN] Warn message");
  expect(console.error).toHaveBeenCalledWith("[ERROR] Error message");
});

test("本番環境でのロガーがdebugレベルを出力しないこと", () => {
  // 本番環境を模倣
  vi.stubEnv("NODE_ENV", "production");

  const logger = getLogger();

  logger.debug("Debug message");
  logger.info("Info message");
  logger.warn("Warn message");
  logger.error("Error message");

  expect(console.debug).not.toHaveBeenCalled();
  expect(console.info).toHaveBeenCalledWith("[INFO] Info message");
  expect(console.warn).toHaveBeenCalledWith("[WARN] Warn message");
  expect(console.error).toHaveBeenCalledWith("[ERROR] Error message");

  // 環境変数をリセット
  vi.unstubAllEnvs();
});
