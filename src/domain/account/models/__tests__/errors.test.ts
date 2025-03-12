import { expect, test } from "vitest";
import { createAuthError } from "../errors";
import { createRepositoryError } from "@/domain/shared/models/common";

test("createAuthError関数が正しい認証エラーオブジェクトを作成すること", () => {
  // 準備
  const type = "INVALID_CREDENTIALS";
  const message = "認証情報が無効です";
  const cause = new Error("原因エラー");

  // 実行
  const error = createAuthError(type, message, cause);

  // 検証
  expect(error.name).toBe("AuthError");
  expect(error.type).toBe(type);
  expect(error.message).toBe(message);
  expect(error.cause).toBe(cause);
});

test("createAuthError関数がcauseなしでも正しく動作すること", () => {
  // 準備
  const type = "UNAUTHORIZED";
  const message = "権限がありません";

  // 実行
  const error = createAuthError(type, message);

  // 検証
  expect(error.name).toBe("AuthError");
  expect(error.type).toBe(type);
  expect(error.message).toBe(message);
  expect(error.cause).toBeUndefined();
});

test("共有カーネルのcreateRepositoryError関数が正しく動作すること", () => {
  // 準備
  const type = "NOT_FOUND";
  const message = "ユーザーが見つかりません";
  const cause = new Error("原因エラー");

  // 実行
  const error = createRepositoryError(type, message, cause);

  // 検証
  expect(error.name).toBe("RepositoryError");
  expect(error.type).toBe(type);
  expect(error.message).toBe(message);
  expect(error.cause).toBe(cause);
});
