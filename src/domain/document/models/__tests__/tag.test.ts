import { expect, test } from "vitest";
import { createTag, updateTag, createDocumentTag } from "../tag";

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
    updatedAt: expect.any(Date)
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
    userId: "user-123"
  };
  
  const newName = "TypeScript";
  
  // Act
  const result = updateTag(originalTag, newName);
  
  // Assert
  expect(result).toEqual({
    ...originalTag,
    name: newName,
    updatedAt: expect.any(Date)
  });
  
  // 更新日時が変更されていることを確認
  expect(result.updatedAt.getTime()).toBeGreaterThan(originalTag.updatedAt.getTime());
  
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
    createdAt: expect.any(Date)
  });
}); 