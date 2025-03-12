import { createRepositoryError } from "@/domain/shared/models/common";
import { err, ok } from "neverthrow";
import { expect, test, vi, beforeEach } from "vitest";
import type { DocumentTag } from "../../models/tag";
import type { DocumentTagRepository } from "../../repositories/tag";
import { SaveDocumentTagUseCase } from "../saveDocumentTag";

// モックのドキュメントタグリポジトリを作成
const mockDocumentTagRepository: DocumentTagRepository = {
  findByDocumentId: vi.fn(),
  findByTagId: vi.fn(),
  save: vi.fn(),
  delete: vi.fn(),
  deleteByDocumentIdAndTagId: vi.fn()
};

// テスト用のドキュメントタグデータ
const mockDocumentTag: DocumentTag = {
  id: "doctag-123",
  documentId: "doc-123",
  tagId: "tag-123",
  createdAt: new Date()
};

// テスト前にモックをリセット
beforeEach(() => {
  vi.resetAllMocks();
});

test("有効なドキュメントタグを指定すると保存されて返されること", async () => {
  // Arrange
  (mockDocumentTagRepository.save as ReturnType<typeof vi.fn>).mockResolvedValue(ok({
    ...mockDocumentTag
  }));
  const useCase = new SaveDocumentTagUseCase(mockDocumentTagRepository);

  // Act
  const result = await useCase.execute(mockDocumentTag);

  // Assert
  expect(result.isOk()).toBe(true);
  result.map((data) => {
    expect(data.id).toEqual(mockDocumentTag.id);
    expect(data.documentId).toEqual(mockDocumentTag.documentId);
    expect(data.tagId).toEqual(mockDocumentTag.tagId);
  });
  expect(mockDocumentTagRepository.save).toHaveBeenCalledWith(mockDocumentTag);
});

test("リポジトリでエラーが発生した場合はエラーが返されること", async () => {
  // Arrange
  const repositoryError = createRepositoryError(
    "DATABASE_ERROR",
    "データベースエラーが発生しました",
  );
  (mockDocumentTagRepository.save as ReturnType<typeof vi.fn>).mockResolvedValue(err(repositoryError));
  const useCase = new SaveDocumentTagUseCase(mockDocumentTagRepository);

  // Act
  const result = await useCase.execute(mockDocumentTag);

  // Assert
  expect(result.isErr()).toBe(true);
  result.mapErr((error) => {
    expect(error).toEqual(repositoryError);
  });
  expect(mockDocumentTagRepository.save).toHaveBeenCalledWith(mockDocumentTag);
});

// エッジケースのテスト
test("IDがないドキュメントタグを保存すると新しいIDが割り当てられること", async () => {
  // Arrange
  const documentTagWithoutId = {
    ...mockDocumentTag,
    id: "" as string // 空のID
  };
  
  const savedDocumentTag = {
    ...mockDocumentTag,
    id: "new-doctag-id", // 新しいID
    updatedAt: new Date()
  };
  
  (mockDocumentTagRepository.save as ReturnType<typeof vi.fn>).mockResolvedValue(ok(savedDocumentTag));
  const useCase = new SaveDocumentTagUseCase(mockDocumentTagRepository);

  // Act
  const result = await useCase.execute(documentTagWithoutId);

  // Assert
  expect(result.isOk()).toBe(true);
  result.map((data) => {
    expect(data.id).toBe("new-doctag-id");
    expect(data.id).not.toBe("");
  });
});

// 境界条件のテスト
test("古い作成日時を持つドキュメントタグを保存しても日時は変更されないこと", async () => {
  // Arrange
  const pastDate = new Date();
  pastDate.setFullYear(pastDate.getFullYear() - 1); // 1年前
  
  const documentTagWithPastDate = {
    ...mockDocumentTag,
    createdAt: pastDate
  };
  
  const savedDocumentTag = {
    ...documentTagWithPastDate
  };
  
  (mockDocumentTagRepository.save as ReturnType<typeof vi.fn>).mockResolvedValue(ok(savedDocumentTag));
  const useCase = new SaveDocumentTagUseCase(mockDocumentTagRepository);

  // Act
  const result = await useCase.execute(documentTagWithPastDate);

  // Assert
  expect(result.isOk()).toBe(true);
  result.map((data) => {
    expect(data.createdAt).toEqual(pastDate);
  });
});

// 無効な入力のテスト
test("必須フィールドが欠けているドキュメントタグを保存するとエラーになること", async () => {
  // Arrange
  const invalidDocumentTag = {
    ...mockDocumentTag,
    documentId: "", // 空のドキュメントID
    tagId: ""       // 空のタグID
  };
  
  const validationError = createRepositoryError(
    "VALIDATION_ERROR",
    "ドキュメントIDとタグIDは必須です",
  );
  
  (mockDocumentTagRepository.save as ReturnType<typeof vi.fn>).mockResolvedValue(err(validationError));
  const useCase = new SaveDocumentTagUseCase(mockDocumentTagRepository);

  // Act
  const result = await useCase.execute(invalidDocumentTag);

  // Assert
  expect(result.isErr()).toBe(true);
  result.mapErr((error) => {
    expect(error.type).toBe("VALIDATION_ERROR");
  });
});

// セキュリティ関連のテスト
test("異なるユーザーのドキュメントとタグの関連付けを保存しようとした場合の検証", async () => {
  // Arrange
  // 実際のアプリケーションでは、ドキュメントとタグの所有者を確認する必要があります
  // このテストでは、リポジトリレベルでの検証は行わず、ユースケースの動作のみを確認します
  
  const documentTagForOtherUser = {
    ...mockDocumentTag,
    documentId: "doc-456", // 異なるユーザーのドキュメントID
    tagId: "tag-456"       // 異なるユーザーのタグID
  };
  
  (mockDocumentTagRepository.save as ReturnType<typeof vi.fn>).mockResolvedValue(ok(documentTagForOtherUser));
  const useCase = new SaveDocumentTagUseCase(mockDocumentTagRepository);

  // Act
  const result = await useCase.execute(documentTagForOtherUser);

  // Assert
  expect(result.isOk()).toBe(true);
  
  // 実際のアプリケーションでは、保存前にドキュメントとタグの所有者を検証し、
  // 権限がない場合は操作を拒否する必要があります
}); 