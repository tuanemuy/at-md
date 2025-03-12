import { expect, test } from "vitest";
import { createSyncError, type SyncError, type SyncErrorCode } from "../errors";

test("エラータイプとメッセージを指定して同期エラーを作成すると正しいオブジェクトが返されること", () => {
  // Arrange
  const type = "FILE_NOT_FOUND";
  const message = "ファイルが見つかりません";

  // Act
  const result = createSyncError(type, message);

  // Assert
  expect(result).toEqual({
    name: "SyncError",
    type,
    message,
    cause: undefined,
  });
});

test("エラータイプ、メッセージ、原因を指定して同期エラーを作成すると正しいオブジェクトが返されること", () => {
  // Arrange
  const type = "API_ERROR";
  const message = "APIエラーが発生しました";
  const cause = new Error("Network error");

  // Act
  const result = createSyncError(type, message, cause);

  // Assert
  expect(result).toEqual({
    name: "SyncError",
    type,
    message,
    cause,
  });
});

// エッジケースのテスト
test("非常に長いエラーメッセージを持つ同期エラーを作成できること", () => {
  // Arrange
  const type = "API_ERROR";
  const longMessage = "E".repeat(10000); // 非常に長いエラーメッセージ

  // Act
  const result = createSyncError(type, longMessage);

  // Assert
  expect(result.message).toBe(longMessage);
  expect(result.message.length).toBe(10000);
});

test("複雑なエラーオブジェクトを原因として持つ同期エラーを作成できること", () => {
  // Arrange
  const type = "API_ERROR";
  const message = "APIエラーが発生しました";
  const complexCause = {
    name: "HttpError",
    status: 500,
    message: "Internal Server Error",
    details: {
      requestId: "req-123",
      timestamp: new Date(),
      path: "/api/sync",
      method: "POST",
    },
  };

  // Act
  const result = createSyncError(type, message, complexCause);

  // Assert
  expect(result.cause).toEqual(complexCause);
});

test("ネストされたエラーを原因として持つ同期エラーを作成できること", () => {
  // Arrange
  const type = "API_ERROR";
  const message = "APIエラーが発生しました";
  const innerError = new Error("Network error");
  const middleError = createSyncError(
    "PARSE_ERROR",
    "パースエラーが発生しました",
    innerError,
  );

  // Act
  const result = createSyncError(type, message, middleError);

  // Assert
  expect(result.cause).toEqual(middleError);
  expect((result.cause as SyncError).cause).toEqual(innerError);
});

// 境界条件のテスト
test("空のエラーメッセージを持つ同期エラーを作成できること", () => {
  // Arrange
  const type = "FILE_NOT_FOUND";
  const emptyMessage = "";

  // Act
  const result = createSyncError(type, emptyMessage);

  // Assert
  expect(result.message).toBe(emptyMessage);
});

test("すべての有効なエラータイプで同期エラーを作成できること", () => {
  // Arrange
  const types: SyncErrorCode[] = [
    "GITHUREPO_NOT_FOUND",
    "FILE_NOT_FOUND",
    "PARSE_ERROR",
    "API_ERROR",
  ];
  const message = "エラーが発生しました";

  // Act & Assert
  for (const type of types) {
    const result = createSyncError(type, message);
    expect(result.type).toBe(type);
    expect(result.name).toBe("SyncError");
  }
});

// 無効な入力のテスト
test("undefinedを原因として持つ同期エラーを作成できること", () => {
  // Arrange
  const type = "API_ERROR";
  const message = "APIエラーが発生しました";
  const undefinedCause = undefined;

  // Act
  const result = createSyncError(type, message, undefinedCause);

  // Assert
  expect(result.cause).toBeUndefined();
});

test("Errorオブジェクト以外の値を原因として持つ同期エラーを作成できること", () => {
  // Arrange
  const type = "API_ERROR";
  const message = "APIエラーが発生しました";
  const cause =
    "これはエラーオブジェクトではなく文字列です" as unknown as Error;

  // Act
  const result = createSyncError(type, message, cause);

  // Assert
  expect(result.cause).toBe(cause);
});
