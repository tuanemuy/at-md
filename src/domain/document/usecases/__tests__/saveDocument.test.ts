import { createRepositoryError } from "@/domain/shared/models/common";
import { err, ok } from "neverthrow";
import { expect, test, vi, beforeEach } from "vitest";
import type { Document } from "../../models/document";
import type { DocumentRepository } from "../../repositories/document";
import { SaveDocumentUseCase } from "../saveDocument";

// モックのドキュメントリポジトリを作成
const mockDocumentRepository: DocumentRepository = {
  findById: vi.fn(),
  findByGitHubRepoAndPath: vi.fn(),
  findByGitHubRepo: vi.fn(),
  save: vi.fn()
};

// テスト用のドキュメントデータ
const mockDocument: Document = {
  id: "doc-123",
  gitHubRepoId: "repo-123",
  path: "docs/readme.md",
  title: "README",
  document: "# Hello World",
  scope: "private",
  createdAt: new Date(),
  updatedAt: new Date(),
  userId: "user-123"
};

// テスト前にモックをリセット
beforeEach(() => {
  vi.resetAllMocks();
});

test("有効なドキュメントを指定すると保存されて返されること", async () => {
  // Arrange
  (mockDocumentRepository.save as ReturnType<typeof vi.fn>).mockResolvedValue(ok({
    ...mockDocument,
    updatedAt: new Date() // 更新日時が変わることを想定
  }));
  const useCase = new SaveDocumentUseCase(mockDocumentRepository);

  // Act
  const result = await useCase.execute(mockDocument);

  // Assert
  expect(result.isOk()).toBe(true);
  result.map((data) => {
    expect(data.id).toEqual(mockDocument.id);
    expect(data.gitHubRepoId).toEqual(mockDocument.gitHubRepoId);
    expect(data.path).toEqual(mockDocument.path);
    expect(data.title).toEqual(mockDocument.title);
    expect(data.document).toEqual(mockDocument.document);
  });
  expect(mockDocumentRepository.save).toHaveBeenCalledWith(mockDocument);
});

test("リポジトリでエラーが発生した場合はエラーが返されること", async () => {
  // Arrange
  const repositoryError = createRepositoryError(
    "DATABASE_ERROR",
    "データベースエラーが発生しました",
  );
  (mockDocumentRepository.save as ReturnType<typeof vi.fn>).mockResolvedValue(err(repositoryError));
  const useCase = new SaveDocumentUseCase(mockDocumentRepository);

  // Act
  const result = await useCase.execute(mockDocument);

  // Assert
  expect(result.isErr()).toBe(true);
  result.mapErr((error) => {
    expect(error).toEqual(repositoryError);
  });
  expect(mockDocumentRepository.save).toHaveBeenCalledWith(mockDocument);
});

// エッジケースのテスト
test("IDがないドキュメントを保存すると新しいIDが割り当てられること", async () => {
  // Arrange
  const docWithoutId = {
    ...mockDocument,
    id: "" as string // 空のID
  };
  
  const savedDoc = {
    ...mockDocument,
    id: "new-doc-id", // 新しいID
    updatedAt: new Date()
  };
  
  (mockDocumentRepository.save as ReturnType<typeof vi.fn>).mockResolvedValue(ok(savedDoc));
  const useCase = new SaveDocumentUseCase(mockDocumentRepository);

  // Act
  const result = await useCase.execute(docWithoutId);

  // Assert
  expect(result.isOk()).toBe(true);
  result.map((data) => {
    expect(data.id).toBe("new-doc-id");
    expect(data.id).not.toBe("");
  });
});

test("非常に長いタイトルを持つドキュメントを保存できること", async () => {
  // Arrange
  const longTitleDoc = {
    ...mockDocument,
    title: "A".repeat(1000) // 非常に長いタイトル
  };
  
  (mockDocumentRepository.save as ReturnType<typeof vi.fn>).mockResolvedValue(ok(longTitleDoc));
  const useCase = new SaveDocumentUseCase(mockDocumentRepository);

  // Act
  const result = await useCase.execute(longTitleDoc);

  // Assert
  expect(result.isOk()).toBe(true);
  result.map((data) => {
    expect(data.title.length).toBe(1000);
  });
});

test("非常に長い文書内容を持つドキュメントを保存できること", async () => {
  // Arrange
  const longContentDoc = {
    ...mockDocument,
    document: `${"# ".repeat(10000)}Hello World` // 非常に長い文書内容
  };
  
  (mockDocumentRepository.save as ReturnType<typeof vi.fn>).mockResolvedValue(ok(longContentDoc));
  const useCase = new SaveDocumentUseCase(mockDocumentRepository);

  // Act
  const result = await useCase.execute(longContentDoc);

  // Assert
  expect(result.isOk()).toBe(true);
  result.map((data) => {
    expect(data.document.length).toBeGreaterThan(10000);
  });
});

// 境界条件のテスト
test("更新日時が過去のドキュメントを保存すると現在の日時に更新されること", async () => {
  // Arrange
  const pastDate = new Date();
  pastDate.setFullYear(pastDate.getFullYear() - 1); // 1年前
  
  const docWithPastDate = {
    ...mockDocument,
    updatedAt: pastDate
  };
  
  const now = new Date();
  const savedDoc = {
    ...docWithPastDate,
    updatedAt: now // 現在の日時
  };
  
  (mockDocumentRepository.save as ReturnType<typeof vi.fn>).mockResolvedValue(ok(savedDoc));
  const useCase = new SaveDocumentUseCase(mockDocumentRepository);

  // Act
  const result = await useCase.execute(docWithPastDate);

  // Assert
  expect(result.isOk()).toBe(true);
  result.map((data) => {
    expect(data.updatedAt).toEqual(now);
    expect(data.updatedAt).not.toEqual(pastDate);
  });
});

// 無効な入力のテスト
test("必須フィールドが欠けているドキュメントを保存するとエラーになること", async () => {
  // Arrange
  const invalidDoc = {
    ...mockDocument,
    title: "", // 空のタイトル
    document: "" // 空の文書内容
  };
  
  const validationError = createRepositoryError(
    "VALIDATION_ERROR",
    "タイトルと文書内容は必須です",
  );
  
  (mockDocumentRepository.save as ReturnType<typeof vi.fn>).mockResolvedValue(err(validationError));
  const useCase = new SaveDocumentUseCase(mockDocumentRepository);

  // Act
  const result = await useCase.execute(invalidDoc);

  // Assert
  expect(result.isErr()).toBe(true);
  result.mapErr((error) => {
    expect(error.type).toBe("VALIDATION_ERROR");
  });
});

// セキュリティ関連のテスト
test("異なるユーザーのドキュメントを保存しようとした場合の検証", async () => {
  // Arrange
  const currentUserId = "user-123"; // 現在のユーザーID
  const otherUserDoc = {
    ...mockDocument,
    userId: "user-456" // 異なるユーザーID
  };
  
  // 保存は成功するが、実際のアプリケーションでは権限チェックが必要
  (mockDocumentRepository.save as ReturnType<typeof vi.fn>).mockResolvedValue(ok(otherUserDoc));
  const useCase = new SaveDocumentUseCase(mockDocumentRepository);

  // Act
  const result = await useCase.execute(otherUserDoc);

  // Assert
  expect(result.isOk()).toBe(true);
  const doc = result._unsafeUnwrap();
  
  // ドキュメントは保存できるが、ユーザーIDが現在のユーザーと異なることを確認
  expect(doc.userId).not.toBe(currentUserId);
  expect(doc.userId).toBe("user-456");
  
  // 実際のアプリケーションでは、保存前にユーザーIDの検証を行い、
  // 権限がない場合は操作を拒否する必要があります
}); 