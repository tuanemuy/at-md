import { err, ok } from "neverthrow";
import { expect, test, vi } from "vitest";
import type { Document } from "../../models/document";
import { createSyncError } from "../../models/errors";
import type { GitHubRepo } from "../../models/githubRepo";
import type { SyncService } from "../../services/sync";
import { SyncFileUseCase } from "../syncFile";

test("有効なパラメータを指定するとファイルが同期されて文書が返されること", async () => {
  // Arrange
  const gitHubRepo: GitHubRepo = {
    id: "repo-123",
    owner: "octocat",
    name: "hello-world",
    fullName: "octocat/hello-world",
    installationId: "inst-123",
    createdAt: new Date(),
    updatedAt: new Date(),
    userId: "user-123",
  };

  const path = "docs/readme.md";
  const userId = "user-123";

  const document: Document = {
    id: "doc-123",
    gitHubRepoId: gitHubRepo.id,
    path,
    title: "README",
    document: "# Hello World",
    scope: "private",
    createdAt: new Date(),
    updatedAt: new Date(),
    userId,
  };

  const mockSyncService: SyncService = {
    fetchFile: vi.fn(),
    fetchFiles: vi.fn(),
    syncFile: vi.fn().mockResolvedValue(ok(document)),
    syncAllFiles: vi.fn(),
  };

  const useCase = new SyncFileUseCase(mockSyncService);

  // Act
  const result = await useCase.execute(gitHubRepo, path, userId);

  // Assert
  expect(result.isOk()).toBe(true);
  result.map((data) => {
    expect(data).toEqual(document);
  });
  expect(mockSyncService.syncFile).toHaveBeenCalledWith(
    gitHubRepo,
    path,
    userId,
  );
});

test("同期サービスでエラーが発生した場合はエラーが返されること", async () => {
  // Arrange
  const gitHubRepo: GitHubRepo = {
    id: "repo-123",
    owner: "octocat",
    name: "hello-world",
    fullName: "octocat/hello-world",
    installationId: "inst-123",
    createdAt: new Date(),
    updatedAt: new Date(),
    userId: "user-123",
  };

  const path = "docs/non-existent.md";
  const userId = "user-123";

  const syncError = createSyncError(
    "FILE_NOT_FOUND",
    "ファイルが見つかりません",
  );

  const mockSyncService: SyncService = {
    fetchFile: vi.fn(),
    fetchFiles: vi.fn(),
    syncFile: vi.fn().mockResolvedValue(err(syncError)),
    syncAllFiles: vi.fn(),
  };

  const useCase = new SyncFileUseCase(mockSyncService);

  // Act
  const result = await useCase.execute(gitHubRepo, path, userId);

  // Assert
  expect(result.isErr()).toBe(true);
  result.mapErr((error) => {
    expect(error).toEqual(syncError);
  });
  expect(mockSyncService.syncFile).toHaveBeenCalledWith(
    gitHubRepo,
    path,
    userId,
  );
});
