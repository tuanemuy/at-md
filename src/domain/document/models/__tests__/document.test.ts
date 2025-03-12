import { expect, test } from "vitest";
import { createDocument, updateDocument, type Document } from "../document";

test("必要なパラメータを指定して文書を作成すると正しい文書オブジェクトが返されること", () => {
  // Arrange
  const gitHubRepoId = "repo-123";
  const path = "docs/readme.md";
  const title = "README";
  const document = "# Hello World";
  const userId = "user-123";
  
  // Act
  const result = createDocument(gitHubRepoId, path, title, document, userId);
  
  // Assert
  expect(result).toEqual({
    gitHubRepoId,
    path,
    title,
    document,
    userId,
    scope: "private", // デフォルト値
    createdAt: expect.any(Date),
    updatedAt: expect.any(Date),
  });
});

test("オプションパラメータを指定して文書を作成すると正しい文書オブジェクトが返されること", () => {
  // Arrange
  const gitHubRepoId = "repo-123";
  const path = "docs/readme.md";
  const title = "README";
  const document = "# Hello World";
  const userId = "user-123";
  const description = "This is a readme file";
  const scope = "public";
  
  // Act
  const result = createDocument(gitHubRepoId, path, title, document, userId, description, scope);
  
  // Assert
  expect(result).toEqual({
    gitHubRepoId,
    path,
    title,
    document,
    userId,
    description,
    scope,
    createdAt: expect.any(Date),
    updatedAt: expect.any(Date),
  });
});

test("文書を更新すると指定したフィールドだけが更新されること", () => {
  // Arrange
  const now = new Date();
  const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
  
  const originalDocument: Document = {
    id: "doc-123",
    gitHubRepoId: "repo-123",
    path: "docs/readme.md",
    title: "Old Title",
    description: "Old description",
    document: "# Old Content",
    scope: "private",
    createdAt: fiveMinutesAgo,
    updatedAt: fiveMinutesAgo,
    userId: "user-123"
  };
  
  const updates = {
    title: "New Title",
    document: "# New Content",
    scope: "public" as const
  };
  
  // Act
  const result = updateDocument(originalDocument, updates);
  
  // Assert
  expect(result).toEqual({
    ...originalDocument,
    ...updates,
    updatedAt: expect.any(Date)
  });
  
  // 更新日時が変更されていることを確認
  expect(result.updatedAt.getTime()).toBeGreaterThan(originalDocument.updatedAt.getTime());
  
  // 他のフィールドが変更されていないことを確認
  expect(result.id).toBe(originalDocument.id);
  expect(result.gitHubRepoId).toBe(originalDocument.gitHubRepoId);
  expect(result.path).toBe(originalDocument.path);
  expect(result.createdAt).toBe(originalDocument.createdAt);
  expect(result.userId).toBe(originalDocument.userId);
}); 