import { createRepositoryError } from "@/domain/shared/models/common";
import { err, ok } from "neverthrow";
import { expect, test, vi, beforeEach } from "vitest";
import type { Document } from "../../models/document";
import type { DocumentRepository } from "../../repositories/document";
import { GetDocumentUseCase } from "../getDocument";

// モックのドキュメントリポジトリを作成
const mockDocumentRepository: DocumentRepository = {
  findById: vi.fn(),
  findByGitHubRepoAndPath: vi.fn(),
  findByGitHubRepo: vi.fn(),
  save: vi.fn(),
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
  userId: "user-123",
};

// 別のユーザーのドキュメントデータ
const otherUserDocument: Document = {
  ...mockDocument,
  id: "doc-456",
  userId: "user-456",
};

// テスト前にモックをリセット
beforeEach(() => {
  vi.resetAllMocks();
});

test("存在する文書IDを指定すると文書が返されること", async () => {
  // Arrange
  (
    mockDocumentRepository.findById as ReturnType<typeof vi.fn>
  ).mockResolvedValue(ok(mockDocument));
  const useCase = new GetDocumentUseCase(mockDocumentRepository);

  // Act
  const result = await useCase.execute(mockDocument.id);

  // Assert
  expect(result.isOk()).toBe(true);
  result.map((data) => {
    expect(data).toEqual(mockDocument);
  });
  expect(mockDocumentRepository.findById).toHaveBeenCalledWith(mockDocument.id);
});

test("存在しない文書IDを指定するとnullが返されること", async () => {
  // Arrange
  const documentId = "non-existent-id";
  (
    mockDocumentRepository.findById as ReturnType<typeof vi.fn>
  ).mockResolvedValue(ok(null));
  const useCase = new GetDocumentUseCase(mockDocumentRepository);

  // Act
  const result = await useCase.execute(documentId);

  // Assert
  expect(result.isOk()).toBe(true);
  result.map((data) => {
    expect(data).toBeNull();
  });
  expect(mockDocumentRepository.findById).toHaveBeenCalledWith(documentId);
});

test("リポジトリでエラーが発生した場合はエラーが返されること", async () => {
  // Arrange
  const documentId = "doc-123";
  const repositoryError = createRepositoryError(
    "DATABASE_ERROR",
    "データベースエラーが発生しました",
  );
  (
    mockDocumentRepository.findById as ReturnType<typeof vi.fn>
  ).mockResolvedValue(err(repositoryError));
  const useCase = new GetDocumentUseCase(mockDocumentRepository);

  // Act
  const result = await useCase.execute(documentId);

  // Assert
  expect(result.isErr()).toBe(true);
  result.mapErr((error) => {
    expect(error).toEqual(repositoryError);
  });
  expect(mockDocumentRepository.findById).toHaveBeenCalledWith(documentId);
});

// エッジケースのテスト
test("非常に長いIDを指定しても正しく処理されること", async () => {
  // Arrange
  const longId = "a".repeat(1000); // 非常に長いID
  (
    mockDocumentRepository.findById as ReturnType<typeof vi.fn>
  ).mockResolvedValue(ok(null));
  const useCase = new GetDocumentUseCase(mockDocumentRepository);

  // Act
  const result = await useCase.execute(longId);

  // Assert
  expect(result.isOk()).toBe(true);
  expect(mockDocumentRepository.findById).toHaveBeenCalledWith(longId);
});

test("非常に大きなドキュメント内容を持つ文書を取得できること", async () => {
  // Arrange
  const largeDocument: Document = {
    ...mockDocument,
    document: `${"# ".repeat(10000)}Large Document`, // 非常に大きなドキュメント内容
  };
  (
    mockDocumentRepository.findById as ReturnType<typeof vi.fn>
  ).mockResolvedValue(ok(largeDocument));
  const useCase = new GetDocumentUseCase(mockDocumentRepository);

  // Act
  const result = await useCase.execute("doc-123");

  // Assert
  expect(result.isOk()).toBe(true);
  result.map((document) => {
    expect(document).not.toBeNull();
    expect(document?.document.length).toBeGreaterThan(10000);
  });
});

// 境界条件のテスト
test("空のIDを指定した場合も正しく処理されること", async () => {
  // Arrange
  const emptyId = "";
  (
    mockDocumentRepository.findById as ReturnType<typeof vi.fn>
  ).mockResolvedValue(ok(null));
  const useCase = new GetDocumentUseCase(mockDocumentRepository);

  // Act
  const result = await useCase.execute(emptyId);

  // Assert
  expect(result.isOk()).toBe(true);
  expect(mockDocumentRepository.findById).toHaveBeenCalledWith(emptyId);
});

// 無効な入力のテスト
test("無効なフォーマットのIDを指定した場合も正しく処理されること", async () => {
  // Arrange
  const invalidId = "invalid-id-format";
  (
    mockDocumentRepository.findById as ReturnType<typeof vi.fn>
  ).mockResolvedValue(ok(null));
  const useCase = new GetDocumentUseCase(mockDocumentRepository);

  // Act
  const result = await useCase.execute(invalidId);

  // Assert
  expect(result.isOk()).toBe(true);
  expect(mockDocumentRepository.findById).toHaveBeenCalledWith(invalidId);
});

// セキュリティ関連のテスト
test("異なるユーザーの文書を取得した場合、ユーザーIDの検証が必要であること", async () => {
  // Arrange
  (
    mockDocumentRepository.findById as ReturnType<typeof vi.fn>
  ).mockResolvedValue(ok(otherUserDocument));
  const useCase = new GetDocumentUseCase(mockDocumentRepository);
  const currentUserId = "user-123"; // 現在のユーザーID

  // Act
  const result = await useCase.execute("doc-456");

  // Assert
  expect(result.isOk()).toBe(true);
  const document = result._unsafeUnwrap();

  // 文書は取得できるが、ユーザーIDが異なることを確認
  expect(document).not.toBeNull();
  expect(document?.userId).not.toBe(currentUserId);
  expect(document?.userId).toBe("user-456");

  // 実際のアプリケーションでは、ここでユーザーIDの検証を行い、
  // 権限がない場合はアクセスを拒否する必要があります
  // このテストは、そのような検証の必要性を示しています
});
