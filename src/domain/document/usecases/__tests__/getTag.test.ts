import { createRepositoryError } from "@/domain/shared/models/common";
import { err, ok } from "neverthrow";
import { expect, test, vi, beforeEach } from "vitest";
import type { Tag } from "../../models/tag";
import type { TagRepository } from "../../repositories/tag";
import { GetTagUseCase } from "../getTag";

// モックのタグリポジトリを作成
const mockTagRepository: TagRepository = {
  findById: vi.fn(),
  findBySlug: vi.fn(),
  findByUserId: vi.fn(),
  findByDocumentId: vi.fn(),
  save: vi.fn(),
  delete: vi.fn()
};

// テスト用のタグデータ
const mockTag: Tag = {
  id: "tag-123",
  name: "JavaScript",
  createdAt: new Date(),
  updatedAt: new Date(),
  userId: "user-123"
};

// テスト前にモックをリセット
beforeEach(() => {
  vi.resetAllMocks();
});

test("存在するタグIDを指定するとタグが返されること", async () => {
  // Arrange
  (mockTagRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(ok(mockTag));
  const useCase = new GetTagUseCase(mockTagRepository);

  // Act
  const result = await useCase.execute(mockTag.id);

  // Assert
  expect(result.isOk()).toBe(true);
  result.map((data) => {
    expect(data).toEqual(mockTag);
  });
  expect(mockTagRepository.findById).toHaveBeenCalledWith(mockTag.id);
});

test("存在しないタグIDを指定するとnullが返されること", async () => {
  // Arrange
  const tagId = "non-existent-id";
  (mockTagRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(ok(null));
  const useCase = new GetTagUseCase(mockTagRepository);

  // Act
  const result = await useCase.execute(tagId);

  // Assert
  expect(result.isOk()).toBe(true);
  result.map((data) => {
    expect(data).toBeNull();
  });
  expect(mockTagRepository.findById).toHaveBeenCalledWith(tagId);
});

test("リポジトリでエラーが発生した場合はエラーが返されること", async () => {
  // Arrange
  const tagId = "tag-123";
  const repositoryError = createRepositoryError(
    "DATABASE_ERROR",
    "データベースエラーが発生しました",
  );
  (mockTagRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(err(repositoryError));
  const useCase = new GetTagUseCase(mockTagRepository);

  // Act
  const result = await useCase.execute(tagId);

  // Assert
  expect(result.isErr()).toBe(true);
  result.mapErr((error) => {
    expect(error).toEqual(repositoryError);
  });
  expect(mockTagRepository.findById).toHaveBeenCalledWith(tagId);
});

// エッジケースのテスト
test("非常に長いIDを指定しても正しく処理されること", async () => {
  // Arrange
  const longId = "a".repeat(1000); // 非常に長いID
  (mockTagRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(ok(null));
  const useCase = new GetTagUseCase(mockTagRepository);

  // Act
  const result = await useCase.execute(longId);

  // Assert
  expect(result.isOk()).toBe(true);
  expect(mockTagRepository.findById).toHaveBeenCalledWith(longId);
});

// 境界条件のテスト
test("空のIDを指定した場合も正しく処理されること", async () => {
  // Arrange
  const emptyId = "";
  (mockTagRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(ok(null));
  const useCase = new GetTagUseCase(mockTagRepository);

  // Act
  const result = await useCase.execute(emptyId);

  // Assert
  expect(result.isOk()).toBe(true);
  expect(mockTagRepository.findById).toHaveBeenCalledWith(emptyId);
});

// 無効な入力のテスト
test("無効なフォーマットのIDを指定した場合も正しく処理されること", async () => {
  // Arrange
  const invalidId = "invalid-id-format";
  (mockTagRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(ok(null));
  const useCase = new GetTagUseCase(mockTagRepository);

  // Act
  const result = await useCase.execute(invalidId);

  // Assert
  expect(result.isOk()).toBe(true);
  expect(mockTagRepository.findById).toHaveBeenCalledWith(invalidId);
});

// セキュリティ関連のテスト
test("異なるユーザーのタグを取得した場合、ユーザーIDの検証が必要であること", async () => {
  // Arrange
  const otherUserTag: Tag = {
    ...mockTag,
    id: "tag-456",
    userId: "user-456"
  };
  (mockTagRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(ok(otherUserTag));
  const useCase = new GetTagUseCase(mockTagRepository);
  const currentUserId = "user-123"; // 現在のユーザーID

  // Act
  const result = await useCase.execute("tag-456");

  // Assert
  expect(result.isOk()).toBe(true);
  const tag = result._unsafeUnwrap();

  // タグは取得できるが、ユーザーIDが異なることを確認
  expect(tag).not.toBeNull();
  expect(tag?.userId).not.toBe(currentUserId);
  expect(tag?.userId).toBe("user-456");

  // 実際のアプリケーションでは、ここでユーザーIDの検証を行い、
  // 権限がない場合はアクセスを拒否する必要があります
}); 