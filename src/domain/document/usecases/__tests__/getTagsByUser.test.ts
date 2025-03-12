import { createRepositoryError } from "@/domain/shared/models/common";
import { err, ok } from "neverthrow";
import { expect, test, vi, beforeEach } from "vitest";
import type { Tag } from "../../models/tag";
import type { TagRepository } from "../../repositories/tag";
import { GetTagsByUserUseCase } from "../getTagsByUser";

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

test("有効なユーザーIDを指定するとタグの配列が返されること", async () => {
  // Arrange
  const userId = "user-123";
  (
    mockTagRepository.findByUserId as ReturnType<typeof vi.fn>
  ).mockResolvedValue(ok(mockTags));
  const useCase = new GetTagsByUserUseCase(mockTagRepository);

  // Act
  const result = await useCase.execute(userId);

  // Assert
  expect(result.isOk()).toBe(true);
  result.map((data) => {
    expect(data).toEqual(mockTags);
    expect(data.length).toBe(2);
  });
  expect(mockTagRepository.findByUserId).toHaveBeenCalledWith(userId);
});

test("存在しないユーザーIDを指定すると空の配列が返されること", async () => {
  // Arrange
  const userId = "non-existent-id";
  (
    mockTagRepository.findByUserId as ReturnType<typeof vi.fn>
  ).mockResolvedValue(ok([]));
  const useCase = new GetTagsByUserUseCase(mockTagRepository);

  // Act
  const result = await useCase.execute(userId);

  // Assert
  expect(result.isOk()).toBe(true);
  result.map((data) => {
    expect(data).toEqual([]);
    expect(data.length).toBe(0);
  });
  expect(mockTagRepository.findByUserId).toHaveBeenCalledWith(userId);
});

test("リポジトリでエラーが発生した場合はエラーが返されること", async () => {
  // Arrange
  const userId = "user-123";
  const repositoryError = createRepositoryError(
    "DATABASE_ERROR",
    "データベースエラーが発生しました",
  );
  (
    mockTagRepository.findByUserId as ReturnType<typeof vi.fn>
  ).mockResolvedValue(err(repositoryError));
  const useCase = new GetTagsByUserUseCase(mockTagRepository);

  // Act
  const result = await useCase.execute(userId);

  // Assert
  expect(result.isErr()).toBe(true);
  result.mapErr((error) => {
    expect(error).toEqual(repositoryError);
  });
  expect(mockTagRepository.findByUserId).toHaveBeenCalledWith(userId);
});

// エッジケースのテスト
test("非常に多くのタグを持つユーザーの場合も正しく処理されること", async () => {
  // Arrange
  const userId = "user-with-many-tags";
  const manyTags = Array.from({ length: 100 }, (_, i) => ({
    ...mockTags[0],
    id: `tag-${i}`,
    name: `Tag ${i}`,
  }));

  (
    mockTagRepository.findByUserId as ReturnType<typeof vi.fn>
  ).mockResolvedValue(ok(manyTags));
  const useCase = new GetTagsByUserUseCase(mockTagRepository);

  // Act
  const result = await useCase.execute(userId);

  // Assert
  expect(result.isOk()).toBe(true);
  result.map((data) => {
    expect(data.length).toBe(100);
  });
});

// 境界条件のテスト
test("空のユーザーIDを指定した場合も正しく処理されること", async () => {
  // Arrange
  const emptyUserId = "";
  (
    mockTagRepository.findByUserId as ReturnType<typeof vi.fn>
  ).mockResolvedValue(ok([]));
  const useCase = new GetTagsByUserUseCase(mockTagRepository);

  // Act
  const result = await useCase.execute(emptyUserId);

  // Assert
  expect(result.isOk()).toBe(true);
  expect(mockTagRepository.findByUserId).toHaveBeenCalledWith(emptyUserId);
});

// 無効な入力のテスト
test("無効なフォーマットのユーザーIDを指定した場合も正しく処理されること", async () => {
  // Arrange
  const invalidUserId = "invalid-user-id-format";
  (
    mockTagRepository.findByUserId as ReturnType<typeof vi.fn>
  ).mockResolvedValue(ok([]));
  const useCase = new GetTagsByUserUseCase(mockTagRepository);

  // Act
  const result = await useCase.execute(invalidUserId);

  // Assert
  expect(result.isOk()).toBe(true);
  expect(mockTagRepository.findByUserId).toHaveBeenCalledWith(invalidUserId);
});

// セキュリティ関連のテスト
test("異なるユーザーのタグを取得しようとした場合の検証", async () => {
  // Arrange
  const requestedUserId = "user-456"; // リクエストされたユーザーID
  const currentUserId = "user-123"; // 現在のユーザーID

  // 異なるユーザーのタグを返すようにモックを設定
  const otherUserTags = mockTags.map((tag) => ({
    ...tag,
    userId: requestedUserId,
  }));

  (
    mockTagRepository.findByUserId as ReturnType<typeof vi.fn>
  ).mockResolvedValue(ok(otherUserTags));
  const useCase = new GetTagsByUserUseCase(mockTagRepository);

  // Act
  const result = await useCase.execute(requestedUserId);

  // Assert
  expect(result.isOk()).toBe(true);
  const tags = result._unsafeUnwrap();

  // タグは取得できるが、ユーザーIDが現在のユーザーと異なることを確認
  expect(tags.length).toBeGreaterThan(0);
  for (const tag of tags) {
    expect(tag.userId).toBe(requestedUserId);
    expect(tag.userId).not.toBe(currentUserId);
  }

  // 実際のアプリケーションでは、ここでユーザーIDの検証を行い、
  // 権限がない場合はアクセスを拒否する必要があります
});
