import { expect, test } from "vitest";
import { createPostError, type PostErrorCode } from "../errors";

test("createPostErrorが正しいエラーオブジェクトを返すこと", () => {
  // Arrange
  const type: PostErrorCode = "API_ERROR";
  const message = "Failed to connect to Bluesky API";
  const cause = new Error("Original error");
  
  // Act
  const error = createPostError(type, message, cause);
  
  // Assert
  expect(error).toEqual({
    name: "PostError",
    type,
    message,
    cause
  });
});

test("createPostErrorでcauseを省略できること", () => {
  // Arrange
  const type: PostErrorCode = "CONTENT_NOT_FOUND";
  const message = "Document content not found";
  
  // Act
  const error = createPostError(type, message);
  
  // Assert
  expect(error).toEqual({
    name: "PostError",
    type,
    message,
    cause: undefined
  });
}); 