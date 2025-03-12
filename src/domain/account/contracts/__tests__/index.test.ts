import { expect, test } from "vitest";
import { createUserServiceError } from "../index";

test("createUserServiceError関数が正しいユーザーサービスエラーオブジェクトを作成すること", () => {
  // 準備
  const type = "USER_NOT_FOUND";
  const message = "ユーザーが見つかりません";
  const cause = new Error("原因エラー");

  // 実行
  const error = createUserServiceError(type, message, cause);

  // 検証
  expect(error.name).toBe("UserServiceError");
  expect(error.type).toBe(type);
  expect(error.message).toBe(message);
  expect(error.cause).toBe(cause);
});

test("createUserServiceError関数がcauseなしでも正しく動作すること", () => {
  // 準備
  const type = "SERVICE_ERROR";
  const message = "サービスエラーが発生しました";

  // 実行
  const error = createUserServiceError(type, message);

  // 検証
  expect(error.name).toBe("UserServiceError");
  expect(error.type).toBe(type);
  expect(error.message).toBe(message);
  expect(error.cause).toBeUndefined();
});
