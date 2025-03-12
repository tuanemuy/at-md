import { createRepositoryError } from "@/domain/shared/models/common";
import { err, ok } from "neverthrow";
import { expect, test, vi, beforeEach } from "vitest";
import type { DocumentTagRepository } from "../../repositories/tag";
import { DeleteDocumentTagByDocumentIdAndTagIdUseCase } from "../deleteDocumentTagByDocumentIdAndTagId";

// モックのドキュメントタグリポジトリを作成
const mockDocumentTagRepository: DocumentTagRepository = {
  findByDocumentId: vi.fn(),
  findByTagId: vi.fn(),
  save: vi.fn(),
  delete: vi.fn(),
  deleteByDocumentIdAndTagId: vi.fn()
};

// テスト前にモックをリセット
beforeEach(() => {
  vi.resetAllMocks();
});

test("有効なドキュメントIDとタグIDを指定すると削除が成功すること", async () => {
  // Arrange
  const documentId = "doc-123";
  const tagId = "tag-123";
  (mockDocumentTagRepository.deleteByDocumentIdAndTagId as ReturnType<typeof vi.fn>).mockResolvedValue(ok(undefined));
  const useCase = new DeleteDocumentTagByDocumentIdAndTagIdUseCase(mockDocumentTagRepository);

  // Act
  const result = await useCase.execute(documentId, tagId);

  // Assert
  expect(result.isOk()).toBe(true);
  expect(mockDocumentTagRepository.deleteByDocumentIdAndTagId).toHaveBeenCalledWith(documentId, tagId);
});

test("リポジトリでエラーが発生した場合はエラーが返されること", async () => {
  // Arrange
  const documentId = "doc-123";
  const tagId = "tag-123";
  const repositoryError = createRepositoryError(
    "DATABASE_ERROR",
    "データベースエラーが発生しました",
  );
  (mockDocumentTagRepository.deleteByDocumentIdAndTagId as ReturnType<typeof vi.fn>).mockResolvedValue(err(repositoryError));
  const useCase = new DeleteDocumentTagByDocumentIdAndTagIdUseCase(mockDocumentTagRepository);

  // Act
  const result = await useCase.execute(documentId, tagId);

  // Assert
  expect(result.isErr()).toBe(true);
  result.mapErr((error) => {
    expect(error).toEqual(repositoryError);
  });
  expect(mockDocumentTagRepository.deleteByDocumentIdAndTagId).toHaveBeenCalledWith(documentId, tagId);
});

// エッジケースのテスト
test("存在しないドキュメントIDとタグIDを指定しても正常に処理されること", async () => {
  // Arrange
  const nonExistentDocumentId = "non-existent-doc";
  const nonExistentTagId = "non-existent-tag";
  // 存在しないIDでも成功を返すようにモックを設定
  (mockDocumentTagRepository.deleteByDocumentIdAndTagId as ReturnType<typeof vi.fn>).mockResolvedValue(ok(undefined));
  const useCase = new DeleteDocumentTagByDocumentIdAndTagIdUseCase(mockDocumentTagRepository);

  // Act
  const result = await useCase.execute(nonExistentDocumentId, nonExistentTagId);

  // Assert
  expect(result.isOk()).toBe(true);
  expect(mockDocumentTagRepository.deleteByDocumentIdAndTagId).toHaveBeenCalledWith(nonExistentDocumentId, nonExistentTagId);
});

// 境界条件のテスト
test("空のドキュメントIDとタグIDを指定した場合も正しく処理されること", async () => {
  // Arrange
  const emptyDocumentId = "";
  const emptyTagId = "";
  (mockDocumentTagRepository.deleteByDocumentIdAndTagId as ReturnType<typeof vi.fn>).mockResolvedValue(ok(undefined));
  const useCase = new DeleteDocumentTagByDocumentIdAndTagIdUseCase(mockDocumentTagRepository);

  // Act
  const result = await useCase.execute(emptyDocumentId, emptyTagId);

  // Assert
  expect(result.isOk()).toBe(true);
  expect(mockDocumentTagRepository.deleteByDocumentIdAndTagId).toHaveBeenCalledWith(emptyDocumentId, emptyTagId);
});

// 無効な入力のテスト
test("無効なフォーマットのドキュメントIDとタグIDを指定した場合も正しく処理されること", async () => {
  // Arrange
  const invalidDocumentId = "invalid-doc-id-format";
  const invalidTagId = "invalid-tag-id-format";
  (mockDocumentTagRepository.deleteByDocumentIdAndTagId as ReturnType<typeof vi.fn>).mockResolvedValue(ok(undefined));
  const useCase = new DeleteDocumentTagByDocumentIdAndTagIdUseCase(mockDocumentTagRepository);

  // Act
  const result = await useCase.execute(invalidDocumentId, invalidTagId);

  // Assert
  expect(result.isOk()).toBe(true);
  expect(mockDocumentTagRepository.deleteByDocumentIdAndTagId).toHaveBeenCalledWith(invalidDocumentId, invalidTagId);
});

// セキュリティ関連のテスト
test("異なるユーザーのドキュメントとタグの関連を削除しようとした場合の検証", async () => {
  // Arrange
  const otherUserDocumentId = "doc-456"; // 異なるユーザーのドキュメントID
  const otherUserTagId = "tag-456";      // 異なるユーザーのタグID
  
  // 削除は成功するが、実際のアプリケーションでは権限チェックが必要
  (mockDocumentTagRepository.deleteByDocumentIdAndTagId as ReturnType<typeof vi.fn>).mockResolvedValue(ok(undefined));
  const useCase = new DeleteDocumentTagByDocumentIdAndTagIdUseCase(mockDocumentTagRepository);

  // Act
  const result = await useCase.execute(otherUserDocumentId, otherUserTagId);

  // Assert
  expect(result.isOk()).toBe(true);
  
  // 実際のアプリケーションでは、削除前にドキュメントとタグの所有者を検証し、
  // 権限がない場合は操作を拒否する必要があります
}); 