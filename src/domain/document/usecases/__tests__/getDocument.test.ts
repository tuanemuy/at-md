import { createRepositoryError } from "@/domain/shared/models/common";
import { err, ok } from "neverthrow";
import { expect, test, vi } from "vitest";
import type { Document } from "../../models/document";
import type { DocumentRepository } from "../../repositories/document";
import { GetDocumentUseCase } from "../getDocument";

test("存在する文書IDを指定すると文書が返されること", async () => {
  // Arrange
  const documentId = "doc-123";
  const document: Document = {
    id: documentId,
    gitHubRepoId: "repo-123",
    path: "docs/readme.md",
    title: "README",
    document: "# Hello World",
    scope: "private",
    createdAt: new Date(),
    updatedAt: new Date(),
    userId: "user-123",
  };

  const mockDocumentRepository: DocumentRepository = {
    findById: vi.fn().mockResolvedValue(ok(document)),
    findByGitHubRepoAndPath: vi.fn(),
    findByGitHubRepo: vi.fn(),
    save: vi.fn(),
  };

  const useCase = new GetDocumentUseCase(mockDocumentRepository);

  // Act
  const result = await useCase.execute(documentId);

  // Assert
  expect(result.isOk()).toBe(true);
  result.map((data) => {
    expect(data).toEqual(document);
  });
  expect(mockDocumentRepository.findById).toHaveBeenCalledWith(documentId);
});

test("存在しない文書IDを指定するとnullが返されること", async () => {
  // Arrange
  const documentId = "non-existent-id";

  const mockDocumentRepository: DocumentRepository = {
    findById: vi.fn().mockResolvedValue(ok(null)),
    findByGitHubRepoAndPath: vi.fn(),
    findByGitHubRepo: vi.fn(),
    save: vi.fn(),
  };

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

  const mockDocumentRepository: DocumentRepository = {
    findById: vi.fn().mockResolvedValue(err(repositoryError)),
    findByGitHubRepoAndPath: vi.fn(),
    findByGitHubRepo: vi.fn(),
    save: vi.fn(),
  };

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
