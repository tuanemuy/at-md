import { createRepositoryError } from "@/domain/shared/models/common";
import { err, ok } from "neverthrow";
import { expect, test, vi, beforeEach } from "vitest";
import type { Tag } from "../../models/tag";
import type { TagRepository } from "../../repositories/tag";
import { GetTagsByDocumentUseCase } from "../getTagsByDocument";

// モックのタグリポジトリを作成
const mockTagRepository: TagRepository = {
  findById: vi.fn(),
  findBySlug: vi.fn(),
  findByUserId: vi.fn(),
  findByDocumentId: vi.fn(),
  save: vi.fn(),
  delete: vi.fn(),
};

// テスト用のタグデータ
const mockTags: Tag[] = [
  {
    id: "tag-123",
    name: "JavaScript",
    createdAt: new Date(),
    updatedAt: new Date(),
    userId: "user-123",
  },
  {
    id: "tag-456",
    name: "TypeScript",
    createdAt: new Date(),
    updatedAt: new Date(),
    userId: "user-123",
  },
];

// テスト前にモックをリセット
beforeEach(() => {
  vi.resetAllMocks();
});

test("有効なドキュメントIDを指定するとタグの配列が返されること", async () => {
  // Arrange
  const documentId = "doc-123";
  (
    mockTagRepository.findByDocumentId as ReturnType<typeof vi.fn>
  ).mockResolvedValue(ok(mockTags));
  const useCase = new GetTagsByDocumentUseCase(mockTagRepository);

  // Act
  const result = await useCase.execute(documentId);

  // Assert
  expect(result.isOk()).toBe(true);
  result.map((data) => {
    expect(data).toEqual(mockTags);
    expect(data.length).toBe(2);
  });
  expect(mockTagRepository.findByDocumentId).toHaveBeenCalledWith(documentId);
});

test("存在しないドキュメントIDを指定すると空の配列が返されること", async () => {
  // Arrange
  const documentId = "non-existent-id";
  (
    mockTagRepository.findByDocumentId as ReturnType<typeof vi.fn>
  ).mockResolvedValue(ok([]));
  const useCase = new GetTagsByDocumentUseCase(mockTagRepository);

  // Act
  const result = await useCase.execute(documentId);

  // Assert
  expect(result.isOk()).toBe(true);
  result.map((data) => {
    expect(data).toEqual([]);
    expect(data.length).toBe(0);
  });
  expect(mockTagRepository.findByDocumentId).toHaveBeenCalledWith(documentId);
});

test("リポジトリでエラーが発生した場合はエラーが返されること", async () => {
  // Arrange
  const documentId = "doc-123";
  const repositoryError = createRepositoryError(
    "DATABASE_ERROR",
    "データベースエラーが発生しました",
  );
  (
    mockTagRepository.findByDocumentId as ReturnType<typeof vi.fn>
  ).mockResolvedValue(err(repositoryError));
  const useCase = new GetTagsByDocumentUseCase(mockTagRepository);

  // Act
  const result = await useCase.execute(documentId);

  // Assert
  expect(result.isErr()).toBe(true);
  result.mapErr((error) => {
    expect(error).toEqual(repositoryError);
  });
  expect(mockTagRepository.findByDocumentId).toHaveBeenCalledWith(documentId);
});

// エッジケースのテスト
test("非常に多くのタグを持つドキュメントの場合も正しく処理されること", async () => {
  // Arrange
  const documentId = "doc-with-many-tags";
  const manyTags = Array.from({ length: 100 }, (_, i) => ({
    ...mockTags[0],
    id: `tag-${i}`,
    name: `Tag ${i}`,
  }));

  (
    mockTagRepository.findByDocumentId as ReturnType<typeof vi.fn>
  ).mockResolvedValue(ok(manyTags));
  const useCase = new GetTagsByDocumentUseCase(mockTagRepository);

  // Act
  const result = await useCase.execute(documentId);

  // Assert
  expect(result.isOk()).toBe(true);
  result.map((data) => {
    expect(data.length).toBe(100);
  });
});

// 境界条件のテスト
test("空のドキュメントIDを指定した場合も正しく処理されること", async () => {
  // Arrange
  const emptyDocumentId = "";
  (
    mockTagRepository.findByDocumentId as ReturnType<typeof vi.fn>
  ).mockResolvedValue(ok([]));
  const useCase = new GetTagsByDocumentUseCase(mockTagRepository);

  // Act
  const result = await useCase.execute(emptyDocumentId);

  // Assert
  expect(result.isOk()).toBe(true);
  expect(mockTagRepository.findByDocumentId).toHaveBeenCalledWith(
    emptyDocumentId,
  );
});

// 無効な入力のテスト
test("無効なフォーマットのドキュメントIDを指定した場合も正しく処理されること", async () => {
  // Arrange
  const invalidDocumentId = "invalid-document-id-format";
  (
    mockTagRepository.findByDocumentId as ReturnType<typeof vi.fn>
  ).mockResolvedValue(ok([]));
  const useCase = new GetTagsByDocumentUseCase(mockTagRepository);

  // Act
  const result = await useCase.execute(invalidDocumentId);

  // Assert
  expect(result.isOk()).toBe(true);
  expect(mockTagRepository.findByDocumentId).toHaveBeenCalledWith(
    invalidDocumentId,
  );
});

// セキュリティ関連のテスト
test("異なるユーザーのドキュメントのタグを取得しようとした場合の検証", async () => {
  // Arrange
  const documentId = "doc-456"; // 異なるユーザーのドキュメントID
  const currentUserId = "user-123"; // 現在のユーザーID

  // 異なるユーザーのタグを返すようにモックを設定
  const otherUserTags = mockTags.map((tag) => ({
    ...tag,
    userId: "user-456", // 異なるユーザーID
  }));

  (
    mockTagRepository.findByDocumentId as ReturnType<typeof vi.fn>
  ).mockResolvedValue(ok(otherUserTags));
  const useCase = new GetTagsByDocumentUseCase(mockTagRepository);

  // Act
  const result = await useCase.execute(documentId);

  // Assert
  expect(result.isOk()).toBe(true);
  const tags = result._unsafeUnwrap();

  // タグは取得できるが、ユーザーIDが現在のユーザーと異なることを確認
  expect(tags.length).toBeGreaterThan(0);
  for (const tag of tags) {
    expect(tag.userId).toBe("user-456");
    expect(tag.userId).not.toBe(currentUserId);
  }

  // 実際のアプリケーションでは、ここでユーザーIDの検証を行い、
  // 権限がない場合はアクセスを拒否する必要があります
});
