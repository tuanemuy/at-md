import { expect, test } from "vitest";
import { createDocument, updateDocument, type Document, documentSchema } from "../document";

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

// エッジケースのテスト
test("非常に長いタイトルを持つ文書を作成できること", () => {
  // Arrange
  const gitHubRepoId = "repo-123";
  const path = "docs/readme.md";
  const longTitle = "A".repeat(1000); // 非常に長いタイトル
  const document = "# Hello World";
  const userId = "user-123";
  
  // Act
  const result = createDocument(gitHubRepoId, path, longTitle, document, userId);
  
  // Assert
  expect(result.title).toBe(longTitle);
  expect(result.title.length).toBe(1000);
});

test("非常に長いパスを持つ文書を作成できること", () => {
  // Arrange
  const gitHubRepoId = "repo-123";
  const longPath = `${"docs/".repeat(100)}readme.md`; // 非常に長いパス
  const title = "README";
  const document = "# Hello World";
  const userId = "user-123";
  
  // Act
  const result = createDocument(gitHubRepoId, longPath, title, document, userId);
  
  // Assert
  expect(result.path).toBe(longPath);
});

test("非常に長い文書内容を持つ文書を作成できること", () => {
  // Arrange
  const gitHubRepoId = "repo-123";
  const path = "docs/readme.md";
  const title = "README";
  const longDocument = `${"# ".repeat(10000)}Hello World`; // 非常に長い文書内容
  const userId = "user-123";
  
  // Act
  const result = createDocument(gitHubRepoId, path, title, longDocument, userId);
  
  // Assert
  expect(result.document).toBe(longDocument);
});

// 境界条件のテスト
test("空の説明を持つ文書を作成できること", () => {
  // Arrange
  const gitHubRepoId = "repo-123";
  const path = "docs/readme.md";
  const title = "README";
  const document = "# Hello World";
  const userId = "user-123";
  const emptyDescription = "";
  
  // Act
  const result = createDocument(gitHubRepoId, path, title, document, userId, emptyDescription);
  
  // Assert
  expect(result.description).toBe(emptyDescription);
});

test("すべての有効な公開範囲で文書を作成できること", () => {
  // Arrange
  const gitHubRepoId = "repo-123";
  const path = "docs/readme.md";
  const title = "README";
  const document = "# Hello World";
  const userId = "user-123";
  const scopes = ["private", "public", "limited"] as const;
  
  // Act & Assert
  for (const scope of scopes) {
    const result = createDocument(gitHubRepoId, path, title, document, userId, undefined, scope);
    expect(result.scope).toBe(scope);
  }
});

// 無効な入力のテスト
test("空のパスを持つ文書はスキーマバリデーションに失敗すること", () => {
  // Arrange
  const gitHubRepoId = "repo-123";
  const emptyPath = "";
  const title = "README";
  const document = "# Hello World";
  const userId = "user-123";
  
  // Act
  const result = createDocument(gitHubRepoId, emptyPath, title, document, userId);
  
  // Assert
  expect(() => documentSchema.parse({
    id: "doc-123",
    ...result
  })).toThrow();
});

test("空のタイトルを持つ文書はスキーマバリデーションに失敗すること", () => {
  // Arrange
  const gitHubRepoId = "repo-123";
  const path = "docs/readme.md";
  const emptyTitle = "";
  const document = "# Hello World";
  const userId = "user-123";
  
  // Act
  const result = createDocument(gitHubRepoId, path, emptyTitle, document, userId);
  
  // Assert
  expect(() => documentSchema.parse({
    id: "doc-123",
    ...result
  })).toThrow();
});

test("空の文書内容を持つ文書はスキーマバリデーションに失敗すること", () => {
  // Arrange
  const gitHubRepoId = "repo-123";
  const path = "docs/readme.md";
  const title = "README";
  const emptyDocument = "";
  const userId = "user-123";
  
  // Act
  const result = createDocument(gitHubRepoId, path, title, emptyDocument, userId);
  
  // Assert
  expect(() => documentSchema.parse({
    id: "doc-123",
    ...result
  })).toThrow();
});

test("無効な公開範囲を持つ文書はスキーマバリデーションに失敗すること", () => {
  // Arrange
  const gitHubRepoId = "repo-123";
  const path = "docs/readme.md";
  const title = "README";
  const document = "# Hello World";
  const userId = "user-123";
  const invalidScope = "invalid-scope";
  
  // Assert
  expect(() => documentSchema.parse({
    id: "doc-123",
    gitHubRepoId,
    path,
    title,
    document,
    scope: invalidScope,
    createdAt: new Date(),
    updatedAt: new Date(),
    userId
  })).toThrow();
});

// セキュリティ関連のテスト
test("パストラバーサルを含むパスを持つ文書を作成できること", () => {
  // Arrange
  const gitHubRepoId = "repo-123";
  const traversalPath = "../../../etc/passwd";
  const title = "README";
  const document = "# Hello World";
  const userId = "user-123";
  
  // Act
  const result = createDocument(gitHubRepoId, traversalPath, title, document, userId);
  
  // Assert
  expect(result.path).toBe(traversalPath);
  // 実際のアプリケーションでは、パスの検証とサニタイズが必要です
}); 