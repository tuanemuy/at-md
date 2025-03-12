import { expect, test } from "vitest";
import { createPost, updatePost, publishPost, failPost, type Post, postSchema } from "../post";

test("必要なパラメータを指定して投稿を作成すると正しい投稿オブジェクトが返されること", () => {
  // Arrange
  const documentId = "doc-123";
  const platform = "bluesky";
  const userId = "user-123";
  
  // Act
  const result = createPost(documentId, platform, userId);
  
  // Assert
  expect(result).toEqual({
    documentId,
    platform,
    uri: "",
    userId,
    status: "pending", // デフォルト値
    publishedAt: null,
    createdAt: expect.any(Date),
    updatedAt: expect.any(Date),
  });
});

test("ステータスを指定して投稿を作成すると正しい投稿オブジェクトが返されること", () => {
  // Arrange
  const documentId = "doc-123";
  const platform = "bluesky";
  const userId = "user-123";
  const status = "published";
  
  // Act
  const result = createPost(documentId, platform, userId, status);
  
  // Assert
  expect(result).toEqual({
    documentId,
    platform,
    uri: "",
    userId,
    status,
    publishedAt: null,
    createdAt: expect.any(Date),
    updatedAt: expect.any(Date),
  });
});

test("投稿を更新すると指定したフィールドだけが更新されること", () => {
  // Arrange
  const now = new Date();
  const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
  
  const originalPost: Post = {
    id: "post-123",
    documentId: "doc-123",
    platform: "bluesky",
    uri: "",
    status: "pending",
    publishedAt: null,
    createdAt: fiveMinutesAgo,
    updatedAt: fiveMinutesAgo,
    userId: "user-123"
  };
  
  const updates = {
    uri: "at://user.bsky.app/post/123",
    status: "published" as const,
    publishedAt: now
  };
  
  // Act
  const result = updatePost(originalPost, updates);
  
  // Assert
  expect(result).toEqual({
    ...originalPost,
    ...updates,
    updatedAt: expect.any(Date)
  });
  
  // 更新日時が変更されていることを確認
  expect(result.updatedAt.getTime()).toBeGreaterThan(originalPost.updatedAt.getTime());
  
  // 他のフィールドが変更されていないことを確認
  expect(result.id).toBe(originalPost.id);
  expect(result.documentId).toBe(originalPost.documentId);
  expect(result.platform).toBe(originalPost.platform);
  expect(result.createdAt).toBe(originalPost.createdAt);
  expect(result.userId).toBe(originalPost.userId);
});

test("投稿を公開済みに更新すると正しく更新されること", () => {
  // Arrange
  const now = new Date();
  const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
  
  const originalPost: Post = {
    id: "post-123",
    documentId: "doc-123",
    platform: "bluesky",
    uri: "",
    status: "pending",
    publishedAt: null,
    createdAt: fiveMinutesAgo,
    updatedAt: fiveMinutesAgo,
    userId: "user-123"
  };
  
  const uri = "at://user.bsky.app/post/123";
  
  // Act
  const result = publishPost(originalPost, uri);
  
  // Assert
  expect(result).toEqual({
    ...originalPost,
    status: "published",
    uri,
    publishedAt: expect.any(Date),
    updatedAt: expect.any(Date)
  });
  
  // 公開日時と更新日時が設定されていることを確認
  expect(result.publishedAt).not.toBeNull();
  expect(result.updatedAt.getTime()).toBeGreaterThan(originalPost.updatedAt.getTime());
});

test("投稿を失敗状態に更新すると正しく更新されること", () => {
  // Arrange
  const now = new Date();
  const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
  
  const originalPost: Post = {
    id: "post-123",
    documentId: "doc-123",
    platform: "bluesky",
    uri: "",
    status: "pending",
    publishedAt: null,
    createdAt: fiveMinutesAgo,
    updatedAt: fiveMinutesAgo,
    userId: "user-123"
  };
  
  const errorMessage = "API rate limit exceeded";
  
  // Act
  const result = failPost(originalPost, errorMessage);
  
  // Assert
  expect(result).toEqual({
    ...originalPost,
    status: "failed",
    error: errorMessage,
    updatedAt: expect.any(Date)
  });
  
  // 更新日時が変更されていることを確認
  expect(result.updatedAt.getTime()).toBeGreaterThan(originalPost.updatedAt.getTime());
});

// 無効な入力値と境界値のテスト
test("無効なプラットフォームはTypeScriptの型チェックでエラーになること", () => {
  // このテストはTypeScriptの型チェックでエラーになることを確認するためのもので、
  // 実行時にはエラーにならない
  // @ts-expect-error 無効なプラットフォームを指定
  const post = createPost("doc-123", "invalid-platform", "user-123");
  
  // 実行時には正常に動作する
  expect(post).toHaveProperty("platform", "invalid-platform");
});

test("無効なステータスはTypeScriptの型チェックでエラーになること", () => {
  // このテストはTypeScriptの型チェックでエラーになることを確認するためのもので、
  // 実行時にはエラーにならない
  // @ts-expect-error 無効なステータスを指定
  const post = createPost("doc-123", "bluesky", "user-123", "invalid-status");
  
  // 実行時には正常に動作する
  expect(post).toHaveProperty("status", "invalid-status");
});

test("無効なIDフォーマットでバリデーションエラーが発生すること", () => {
  // Arrange
  const invalidPost = {
    id: "invalid-id", // UUIDフォーマットではない
    documentId: "doc-123",
    platform: "bluesky",
    uri: "",
    status: "pending",
    publishedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    userId: "user-123"
  };
  
  // Act & Assert
  expect(() => postSchema.parse(invalidPost)).toThrow();
}); 