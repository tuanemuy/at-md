import { createRepositoryError } from "@/domain/shared/models/common";
import { err, ok } from "neverthrow";
import { expect, test, vi } from "vitest";
import type { Document } from "../../models/document";
import type { DocumentRepository } from "../../repositories/document";
import { GetDocumentsByGitHubRepoUseCase } from "../getDocumentsByGitHubRepo";

test("存在するGitHubリポジトリIDを指定すると関連する文書の配列が返されること", async () => {
  // Arrange
  const gitHubRepoId = "repo-123";
  const documents: Document[] = [
    {
      id: "doc-1",
      gitHubRepoId,
      path: "docs/readme.md",
      title: "README",
      document: "# Hello World",
      scope: "private",
      createdAt: new Date(),
      updatedAt: new Date(),
      userId: "user-123",
    },
    {
      id: "doc-2",
      gitHubRepoId,
      path: "docs/guide.md",
      title: "Guide",
      document: "# Guide",
      scope: "public",
      createdAt: new Date(),
      updatedAt: new Date(),
      userId: "user-123",
    },
  ];

  const mockDocumentRepository: DocumentRepository = {
    findById: vi.fn(),
    findByGitHubRepoAndPath: vi.fn(),
    findByGitHubRepo: vi.fn().mockResolvedValue(ok(documents)),
    save: vi.fn(),
  };

  const useCase = new GetDocumentsByGitHubRepoUseCase(mockDocumentRepository);

  // Act
  const result = await useCase.execute(gitHubRepoId);

  // Assert
  expect(result.isOk()).toBe(true);
  result.map((data) => {
    expect(data).toEqual(documents);
    expect(data.length).toBe(2);
  });
  expect(mockDocumentRepository.findByGitHubRepo).toHaveBeenCalledWith(
    gitHubRepoId,
  );
});

test("文書が存在しないGitHubリポジトリIDを指定すると空の配列が返されること", async () => {
  // Arrange
  const gitHubRepoId = "repo-without-docs";

  const mockDocumentRepository: DocumentRepository = {
    findById: vi.fn(),
    findByGitHubRepoAndPath: vi.fn(),
    findByGitHubRepo: vi.fn().mockResolvedValue(ok([])),
    save: vi.fn(),
  };

  const useCase = new GetDocumentsByGitHubRepoUseCase(mockDocumentRepository);

  // Act
  const result = await useCase.execute(gitHubRepoId);

  // Assert
  expect(result.isOk()).toBe(true);
  result.map((data) => {
    expect(data).toEqual([]);
    expect(data.length).toBe(0);
  });
  expect(mockDocumentRepository.findByGitHubRepo).toHaveBeenCalledWith(
    gitHubRepoId,
  );
});

test("リポジトリでエラーが発生した場合はエラーが返されること", async () => {
  // Arrange
  const gitHubRepoId = "repo-123";
  const repositoryError = createRepositoryError(
    "DATABASE_ERROR",
    "データベースエラーが発生しました",
  );

  const mockDocumentRepository: DocumentRepository = {
    findById: vi.fn(),
    findByGitHubRepoAndPath: vi.fn(),
    findByGitHubRepo: vi.fn().mockResolvedValue(err(repositoryError)),
    save: vi.fn(),
  };

  const useCase = new GetDocumentsByGitHubRepoUseCase(mockDocumentRepository);

  // Act
  const result = await useCase.execute(gitHubRepoId);

  // Assert
  expect(result.isErr()).toBe(true);
  result.mapErr((error) => {
    expect(error).toEqual(repositoryError);
  });
  expect(mockDocumentRepository.findByGitHubRepo).toHaveBeenCalledWith(
    gitHubRepoId,
  );
});
