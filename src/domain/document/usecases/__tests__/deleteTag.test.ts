import { createRepositoryError } from "@/domain/shared/models/common";
import { err, ok } from "neverthrow";
import { expect, test, vi, beforeEach } from "vitest";
import { DeleteTagUseCase } from "../deleteTag";

// モックリポジトリの作成
const mockTagRepository = {
  findById: vi.fn(),
  findBySlug: vi.fn(),
  findByUserId: vi.fn(),
  findByDocumentId: vi.fn(),
  save: vi.fn(),
  delete: vi.fn()
};

// 各テスト前にモックをリセット
beforeEach(() => {
  vi.resetAllMocks();
});

test("有効なタグIDを指定すると削除が成功すること", async () => {
  // Arrange
  const tagId = "tag-123";
  (mockTagRepository.delete as ReturnType<typeof vi.fn>).mockResolvedValue(ok(undefined));
  const useCase = new DeleteTagUseCase(mockTagRepository);

  // Act
  const result = await useCase.execute(tagId);

  // Assert
  expect(result.isOk()).toBe(true);
  expect(mockTagRepository.delete).toHaveBeenCalledWith(tagId);
});

test("リポジトリでエラーが発生した場合はエラーが返されること", async () => {
  // Arrange
  const tagId = "tag-123";
  const repositoryError = createRepositoryError("DATABASE_ERROR", "タグの削除中にエラーが発生しました");
  (mockTagRepository.delete as ReturnType<typeof vi.fn>).mockResolvedValue(err(repositoryError));
  const useCase = new DeleteTagUseCase(mockTagRepository);

  // Act
  const result = await useCase.execute(tagId);

  // Assert
  expect(result.isErr()).toBe(true);
  expect(mockTagRepository.delete).toHaveBeenCalledWith(tagId);
  if (result.isErr()) {
    expect(result.error).toBe(repositoryError);
  }
});

test("存在しないタグIDを指定した場合も処理が成功すること", async () => {
  // Arrange
  const nonExistentTagId = "non-existent-tag";
  (mockTagRepository.delete as ReturnType<typeof vi.fn>).mockResolvedValue(ok(undefined));
  const useCase = new DeleteTagUseCase(mockTagRepository);

  // Act
  const result = await useCase.execute(nonExistentTagId);

  // Assert
  expect(result.isOk()).toBe(true);
  expect(mockTagRepository.delete).toHaveBeenCalledWith(nonExistentTagId);
});

test("空のタグIDを指定した場合も処理されること", async () => {
  // Arrange
  const emptyTagId = "";
  (mockTagRepository.delete as ReturnType<typeof vi.fn>).mockResolvedValue(ok(undefined));
  const useCase = new DeleteTagUseCase(mockTagRepository);

  // Act
  const result = await useCase.execute(emptyTagId);

  // Assert
  expect(result.isOk()).toBe(true);
  expect(mockTagRepository.delete).toHaveBeenCalledWith(emptyTagId);
});

test("不正な形式のタグIDを指定した場合も処理されること", async () => {
  // Arrange
  const invalidFormatTagId = "invalid-format";
  (mockTagRepository.delete as ReturnType<typeof vi.fn>).mockResolvedValue(ok(undefined));
  const useCase = new DeleteTagUseCase(mockTagRepository);

  // Act
  const result = await useCase.execute(invalidFormatTagId);

  // Assert
  expect(result.isOk()).toBe(true);
  expect(mockTagRepository.delete).toHaveBeenCalledWith(invalidFormatTagId);
});

test("異なるユーザーのタグを削除しようとした場合の検証", async () => {
  // Arrange
  const otherUserTagId = "tag-456"; // 異なるユーザーのタグID
  
  // 削除は成功するが、実際のアプリケーションでは権限チェックが必要
  (mockTagRepository.delete as ReturnType<typeof vi.fn>).mockResolvedValue(ok(undefined));
  const useCase = new DeleteTagUseCase(mockTagRepository);

  // Act
  const result = await useCase.execute(otherUserTagId);

  // Assert
  expect(result.isOk()).toBe(true);
  expect(mockTagRepository.delete).toHaveBeenCalledWith(otherUserTagId);
  
  // 注意: 実際のアプリケーションでは、削除前にタグの所有者を検証し、
  // 権限がない場合は操作を拒否する必要があります
}); 