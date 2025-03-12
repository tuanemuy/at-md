import { expect, test } from "vitest";
import { createSyncError } from "../errors";

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
    cause: undefined
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
    cause
  });
}); 