import { expect, test } from "vitest";
import {
  createTag,
  updateTag,
  createDocumentTag,
  tagSchema,
  documentTagSchema,
} from "../tag";

test("必要なパラメータを指定してタグを作成すると正しいオブジェクトが返されること", () => {
  // Arrange
  const name = "JavaScript";
  const userId = "user-123";

  // Act
  const result = createTag(name, userId);

  // Assert
  expect(result).toEqual({
    name,
    userId,
    createdAt: expect.any(Date),
    updatedAt: expect.any(Date),
  });
});

test("タグを更新すると名前が更新されること", () => {
  // Arrange
  const now = new Date();
  const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

  const originalTag = {
    id: "tag-123",
    name: "JavaScript",
    createdAt: fiveMinutesAgo,
    updatedAt: fiveMinutesAgo,
    userId: "user-123",
  };

  const newName = "TypeScript";

  // Act
  const result = updateTag(originalTag, newName);

  // Assert
  expect(result).toEqual({
    ...originalTag,
    name: newName,
    updatedAt: expect.any(Date),
  });

  // 更新日時が変更されていることを確認
  expect(result.updatedAt.getTime()).toBeGreaterThan(
    originalTag.updatedAt.getTime(),
  );

  // 他のフィールドが変更されていないことを確認
  expect(result.id).toBe(originalTag.id);
  expect(result.createdAt).toBe(originalTag.createdAt);
  expect(result.userId).toBe(originalTag.userId);
});

test("必要なパラメータを指定して文書タグを作成すると正しいオブジェクトが返されること", () => {
  // Arrange
  const documentId = "doc-123";
  const tagId = "tag-123";

  // Act
  const result = createDocumentTag(documentId, tagId);

  // Assert
  expect(result).toEqual({
    documentId,
    tagId,
    createdAt: expect.any(Date),
  });
});

// エッジケースのテスト
test("非常に長い名前を持つタグを作成できること", () => {
  // Arrange
  const longName = "A".repeat(1000); // 非常に長いタグ名
  const userId = "user-123";

  // Act
  const result = createTag(longName, userId);

  // Assert
  expect(result.name).toBe(longName);
  expect(result.name.length).toBe(1000);
});

test("特殊文字を含むタグ名を持つタグを作成できること", () => {
  // Arrange
  const specialName = "JavaScript/TypeScript+React-Vue.js&Angular";
  const userId = "user-123";

  // Act
  const result = createTag(specialName, userId);

  // Assert
  expect(result.name).toBe(specialName);
});

test("同じ名前で更新してもタグが正しく更新されること", () => {
  // Arrange
  const now = new Date();
  const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

  const originalTag = {
    id: "tag-123",
    name: "JavaScript",
    createdAt: fiveMinutesAgo,
    updatedAt: fiveMinutesAgo,
    userId: "user-123",
  };

  const sameName = "JavaScript";

  // Act
  const result = updateTag(originalTag, sameName);

  // Assert
  expect(result.name).toBe(sameName);
  expect(result.updatedAt.getTime()).toBeGreaterThan(
    originalTag.updatedAt.getTime(),
  );
});

// 境界条件のテスト
test("空白のみのタグ名を持つタグを作成できること", () => {
  // Arrange
  const whitespaceOnlyName = "   ";
  const userId = "user-123";

  // Act
  const result = createTag(whitespaceOnlyName, userId);

  // Assert
  expect(result.name).toBe(whitespaceOnlyName);
});

test("数字のみのタグ名を持つタグを作成できること", () => {
  // Arrange
  const numericName = "12345";
  const userId = "user-123";

  // Act
  const result = createTag(numericName, userId);

  // Assert
  expect(result.name).toBe(numericName);
});

// 無効な入力のテスト
test("空のタグ名を持つタグはスキーマバリデーションに失敗すること", () => {
  // Arrange
  const emptyName = "";
  const userId = "user-123";

  // Act
  const result = createTag(emptyName, userId);

  // Assert
  expect(() =>
    tagSchema.parse({
      id: "tag-123",
      ...result,
    }),
  ).toThrow();
});

test("空のユーザーIDを持つタグはスキーマバリデーションに失敗すること", () => {
  // Arrange
  const name = "JavaScript";
  const emptyUserId = "";

  // Act
  const result = createTag(name, emptyUserId);

  // Assert
  expect(() =>
    tagSchema.parse({
      id: "tag-123",
      ...result,
    }),
  ).toThrow();
});

test("空の文書IDを持つ文書タグはスキーマバリデーションに失敗すること", () => {
  // Arrange
  const emptyDocumentId = "";
  const tagId = "tag-123";

  // Act
  const result = createDocumentTag(emptyDocumentId, tagId);

  // Assert
  expect(() =>
    documentTagSchema.parse({
      id: "doc-tag-123",
      ...result,
    }),
  ).toThrow();
});

test("空のタグIDを持つ文書タグはスキーマバリデーションに失敗すること", () => {
  // Arrange
  const documentId = "doc-123";
  const emptyTagId = "";

  // Act
  const result = createDocumentTag(documentId, emptyTagId);

  // Assert
  expect(() =>
    documentTagSchema.parse({
      id: "doc-tag-123",
      ...result,
    }),
  ).toThrow();
});

test("異なるユーザーIDでタグを更新しても元のユーザーIDが維持されること", () => {
  // Arrange
  const originalTag = {
    id: "tag-123",
    name: "JavaScript",
    createdAt: new Date(),
    updatedAt: new Date(),
    userId: "user-123",
  };

  const newName = "TypeScript";

  // Act
  const result = updateTag(originalTag, newName);

  // Assert
  expect(result.userId).toBe(originalTag.userId);
  // updateTag関数は、userIdフィールドの更新を許可していないことを確認
});
