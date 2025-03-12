import { createRepositoryError } from "@/domain/shared/models/common";
import { err, ok } from "neverthrow";
import { expect, test, vi, beforeEach } from "vitest";
import type { DocumentTagRepository } from "../../repositories/tag";
import { DeleteDocumentTagUseCase } from "../deleteDocumentTag";

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

test("有効なドキュメントタグIDを指定すると削除が成功すること", async () => {
  // Arrange
  const documentTagId = "doctag-123";
  (mockDocumentTagRepository.delete as ReturnType<typeof vi.fn>).mockResolvedValue(ok(undefined));
  const useCase = new DeleteDocumentTagUseCase(mockDocumentTagRepository);

  // Act
  const result = await useCase.execute(documentTagId);

  // Assert
  expect(result.isOk()).toBe(true);
  expect(mockDocumentTagRepository.delete).toHaveBeenCalledWith(documentTagId);
});

test("リポジトリでエラーが発生した場合はエラーが返されること", async () => {
  // Arrange
  const documentTagId = "doctag-123";
  const repositoryError = createRepositoryError(
    "DATABASE_ERROR",
    "データベースエラーが発生しました",
  );
  (mockDocumentTagRepository.delete as ReturnType<typeof vi.fn>).mockResolvedValue(err(repositoryError));
  const useCase = new DeleteDocumentTagUseCase(mockDocumentTagRepository);

  // Act
  const result = await useCase.execute(documentTagId);

  // Assert
  expect(result.isErr()).toBe(true);
  result.mapErr((error) => {
    expect(error).toEqual(repositoryError);
  });
  expect(mockDocumentTagRepository.delete).toHaveBeenCalledWith(documentTagId);
});

// エッジケースのテスト
test("存在しないドキュメントタグIDを指定しても正常に処理されること", async () => {
  // Arrange
  const nonExistentId = "non-existent-id";
  // 存在しないIDでも成功を返すようにモックを設定
  (mockDocumentTagRepository.delete as ReturnType<typeof vi.fn>).mockResolvedValue(ok(undefined));
  const useCase = new DeleteDocumentTagUseCase(mockDocumentTagRepository);

  // Act
  const result = await useCase.execute(nonExistentId);

  // Assert
  expect(result.isOk()).toBe(true);
  expect(mockDocumentTagRepository.delete).toHaveBeenCalledWith(nonExistentId);
});

// 境界条件のテスト
test("空のドキュメントタグIDを指定した場合も正しく処理されること", async () => {
  // Arrange
  const emptyId = "";
  (mockDocumentTagRepository.delete as ReturnType<typeof vi.fn>).mockResolvedValue(ok(undefined));
  const useCase = new DeleteDocumentTagUseCase(mockDocumentTagRepository);

  // Act
  const result = await useCase.execute(emptyId);

  // Assert
  expect(result.isOk()).toBe(true);
  expect(mockDocumentTagRepository.delete).toHaveBeenCalledWith(emptyId);
});

// 無効な入力のテスト
test("無効なフォーマットのドキュメントタグIDを指定した場合も正しく処理されること", async () => {
  // Arrange
  const invalidId = "invalid-id-format";
  (mockDocumentTagRepository.delete as ReturnType<typeof vi.fn>).mockResolvedValue(ok(undefined));
  const useCase = new DeleteDocumentTagUseCase(mockDocumentTagRepository);

  // Act
  const result = await useCase.execute(invalidId);

  // Assert
  expect(result.isOk()).toBe(true);
  expect(mockDocumentTagRepository.delete).toHaveBeenCalledWith(invalidId);
});

// セキュリティ関連のテスト
test("異なるユーザーのドキュメントタグを削除しようとした場合の検証", async () => {
  // Arrange
  const otherUserDocumentTagId = "doctag-456"; // 異なるユーザーのドキュメントタグID
  
  // 削除は成功するが、実際のアプリケーションでは権限チェックが必要
  (mockDocumentTagRepository.delete as ReturnType<typeof vi.fn>).mockResolvedValue(ok(undefined));
  const useCase = new DeleteDocumentTagUseCase(mockDocumentTagRepository);

  // Act
  const result = await useCase.execute(otherUserDocumentTagId);

  // Assert
  expect(result.isOk()).toBe(true);
  
  // 実際のアプリケーションでは、削除前にドキュメントタグの所有者を検証し、
  // 権限がない場合は操作を拒否する必要があります
}); 