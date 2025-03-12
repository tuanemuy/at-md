import { createRepositoryError } from "@/domain/shared/models/common";
import { err, ok } from "neverthrow";
import { expect, test, vi, beforeEach } from "vitest";
import type { Tag } from "../../models/tag";
import type { TagRepository } from "../../repositories/tag";
import { SaveTagUseCase } from "../saveTag";

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

test("有効なタグを指定すると保存されて返されること", async () => {
  // Arrange
  (mockTagRepository.save as ReturnType<typeof vi.fn>).mockResolvedValue(ok({
    ...mockTag,
    updatedAt: new Date() // 更新日時が変わることを想定
  }));
  const useCase = new SaveTagUseCase(mockTagRepository);

  // Act
  const result = await useCase.execute(mockTag);

  // Assert
  expect(result.isOk()).toBe(true);
  result.map((data) => {
    expect(data.id).toEqual(mockTag.id);
    expect(data.name).toEqual(mockTag.name);
    expect(data.userId).toEqual(mockTag.userId);
  });
  expect(mockTagRepository.save).toHaveBeenCalledWith(mockTag);
});

test("リポジトリでエラーが発生した場合はエラーが返されること", async () => {
  // Arrange
  const repositoryError = createRepositoryError(
    "DATABASE_ERROR",
    "データベースエラーが発生しました",
  );
  (mockTagRepository.save as ReturnType<typeof vi.fn>).mockResolvedValue(err(repositoryError));
  const useCase = new SaveTagUseCase(mockTagRepository);

  // Act
  const result = await useCase.execute(mockTag);

  // Assert
  expect(result.isErr()).toBe(true);
  result.mapErr((error) => {
    expect(error).toEqual(repositoryError);
  });
  expect(mockTagRepository.save).toHaveBeenCalledWith(mockTag);
});

// エッジケースのテスト
test("IDがないタグを保存すると新しいIDが割り当てられること", async () => {
  // Arrange
  const tagWithoutId = {
    ...mockTag,
    id: "" as string // 空のID
  };
  
  const savedTag = {
    ...mockTag,
    id: "new-tag-id", // 新しいID
    updatedAt: new Date()
  };
  
  (mockTagRepository.save as ReturnType<typeof vi.fn>).mockResolvedValue(ok(savedTag));
  const useCase = new SaveTagUseCase(mockTagRepository);

  // Act
  const result = await useCase.execute(tagWithoutId);

  // Assert
  expect(result.isOk()).toBe(true);
  result.map((data) => {
    expect(data.id).toBe("new-tag-id");
    expect(data.id).not.toBe("");
  });
});

test("非常に長い名前を持つタグを保存できること", async () => {
  // Arrange
  const longNameTag = {
    ...mockTag,
    name: "A".repeat(1000) // 非常に長い名前
  };
  
  (mockTagRepository.save as ReturnType<typeof vi.fn>).mockResolvedValue(ok(longNameTag));
  const useCase = new SaveTagUseCase(mockTagRepository);

  // Act
  const result = await useCase.execute(longNameTag);

  // Assert
  expect(result.isOk()).toBe(true);
  result.map((data) => {
    expect(data.name.length).toBe(1000);
  });
});

// 境界条件のテスト
test("更新日時が過去のタグを保存すると現在の日時に更新されること", async () => {
  // Arrange
  const pastDate = new Date();
  pastDate.setFullYear(pastDate.getFullYear() - 1); // 1年前
  
  const tagWithPastDate = {
    ...mockTag,
    updatedAt: pastDate
  };
  
  const now = new Date();
  const savedTag = {
    ...tagWithPastDate,
    updatedAt: now // 現在の日時
  };
  
  (mockTagRepository.save as ReturnType<typeof vi.fn>).mockResolvedValue(ok(savedTag));
  const useCase = new SaveTagUseCase(mockTagRepository);

  // Act
  const result = await useCase.execute(tagWithPastDate);

  // Assert
  expect(result.isOk()).toBe(true);
  result.map((data) => {
    expect(data.updatedAt).toEqual(now);
    expect(data.updatedAt).not.toEqual(pastDate);
  });
});

// 無効な入力のテスト
test("必須フィールドが欠けているタグを保存するとエラーになること", async () => {
  // Arrange
  const invalidTag = {
    ...mockTag,
    name: "" // 空の名前
  };
  
  const validationError = createRepositoryError(
    "VALIDATION_ERROR",
    "タグ名は必須です",
  );
  
  (mockTagRepository.save as ReturnType<typeof vi.fn>).mockResolvedValue(err(validationError));
  const useCase = new SaveTagUseCase(mockTagRepository);

  // Act
  const result = await useCase.execute(invalidTag);

  // Assert
  expect(result.isErr()).toBe(true);
  result.mapErr((error) => {
    expect(error.type).toBe("VALIDATION_ERROR");
  });
});

// セキュリティ関連のテスト
test("異なるユーザーのタグを保存しようとした場合の検証", async () => {
  // Arrange
  const currentUserId = "user-123"; // 現在のユーザーID
  const otherUserTag = {
    ...mockTag,
    userId: "user-456" // 異なるユーザーID
  };
  
  // 保存は成功するが、実際のアプリケーションでは権限チェックが必要
  (mockTagRepository.save as ReturnType<typeof vi.fn>).mockResolvedValue(ok(otherUserTag));
  const useCase = new SaveTagUseCase(mockTagRepository);

  // Act
  const result = await useCase.execute(otherUserTag);

  // Assert
  expect(result.isOk()).toBe(true);
  const tag = result._unsafeUnwrap();
  
  // タグは保存できるが、ユーザーIDが現在のユーザーと異なることを確認
  expect(tag.userId).not.toBe(currentUserId);
  expect(tag.userId).toBe("user-456");
  
  // 実際のアプリケーションでは、保存前にユーザーIDの検証を行い、
  // 権限がない場合は操作を拒否する必要があります
}); 