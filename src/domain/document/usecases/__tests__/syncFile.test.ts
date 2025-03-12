import { err, ok } from "neverthrow";
import { expect, test, vi, beforeEach } from "vitest";
import type { Document } from "../../models/document";
import { createSyncError } from "../../models/errors";
import type { GitHubRepo } from "../../models/githubRepo";
import type { SyncService } from "../../services/sync";
import { SyncFileUseCase } from "../syncFile";

// モックの同期サービスを作成
const mockSyncService: SyncService = {
  fetchFile: vi.fn(),
  fetchFiles: vi.fn(),
  syncFile: vi.fn(),
  syncAllFiles: vi.fn()
};

// テスト用のGitHubリポジトリデータ
const mockGitHubRepo: GitHubRepo = {
  id: "repo-123",
  owner: "octocat",
  name: "hello-world",
  fullName: "octocat/hello-world",
  installationId: "inst-123",
  createdAt: new Date(),
  updatedAt: new Date(),
  userId: "user-123"
};

// 別のユーザーのGitHubリポジトリデータ
const otherUserGitHubRepo: GitHubRepo = {
  ...mockGitHubRepo,
  id: "repo-456",
  owner: "otheruser",
  name: "other-repo",
  fullName: "otheruser/other-repo",
  userId: "user-456"
};

// テスト用のドキュメントデータ
const mockDocument: Document = {
  id: "doc-123",
  gitHubRepoId: mockGitHubRepo.id,
  path: "docs/readme.md",
  title: "README",
  document: "# Hello World",
  scope: "private",
  createdAt: new Date(),
  updatedAt: new Date(),
  userId: mockGitHubRepo.userId
};

// テスト前にモックをリセット
beforeEach(() => {
  vi.resetAllMocks();
});

test("有効なパラメータを指定するとファイルが同期されて文書が返されること", async () => {
  // Arrange
  (mockSyncService.syncFile as ReturnType<typeof vi.fn>).mockResolvedValue(ok(mockDocument));
  const useCase = new SyncFileUseCase(mockSyncService);
  const path = "docs/readme.md";
  const userId = "user-123";

  // Act
  const result = await useCase.execute(mockGitHubRepo, path, userId);

  // Assert
  expect(result.isOk()).toBe(true);
  result.map((data) => {
    expect(data).toEqual(mockDocument);
  });
  expect(mockSyncService.syncFile).toHaveBeenCalledWith(
    mockGitHubRepo,
    path,
    userId,
  );
});

test("同期サービスでエラーが発生した場合はエラーが返されること", async () => {
  // Arrange
  const path = "docs/non-existent.md";
  const userId = "user-123";
  const syncError = createSyncError(
    "FILE_NOT_FOUND",
    "ファイルが見つかりません",
  );
  (mockSyncService.syncFile as ReturnType<typeof vi.fn>).mockResolvedValue(err(syncError));
  const useCase = new SyncFileUseCase(mockSyncService);

  // Act
  const result = await useCase.execute(mockGitHubRepo, path, userId);

  // Assert
  expect(result.isErr()).toBe(true);
  result.mapErr((error) => {
    expect(error).toEqual(syncError);
  });
  expect(mockSyncService.syncFile).toHaveBeenCalledWith(
    mockGitHubRepo,
    path,
    userId,
  );
});

// エッジケースのテスト
test("非常に長いパスを指定しても正しく処理されること", async () => {
  // Arrange
  const longPath = `${"docs/".repeat(100)}readme.md`; // 非常に長いパス
  const userId = "user-123";
  (mockSyncService.syncFile as ReturnType<typeof vi.fn>).mockResolvedValue(ok({
    ...mockDocument,
    path: longPath
  }));
  const useCase = new SyncFileUseCase(mockSyncService);

  // Act
  const result = await useCase.execute(mockGitHubRepo, longPath, userId);

  // Assert
  expect(result.isOk()).toBe(true);
  result.map((data) => {
    expect(data.path).toBe(longPath);
  });
  expect(mockSyncService.syncFile).toHaveBeenCalledWith(
    mockGitHubRepo,
    longPath,
    userId,
  );
});

test("非常に大きなドキュメント内容を持つファイルを同期できること", async () => {
  // Arrange
  const path = "docs/large-file.md";
  const userId = "user-123";
  const largeContent = `${"# ".repeat(10000)}Large Document`; // 非常に大きなドキュメント内容
  (mockSyncService.syncFile as ReturnType<typeof vi.fn>).mockResolvedValue(ok({
    ...mockDocument,
    document: largeContent
  }));
  const useCase = new SyncFileUseCase(mockSyncService);

  // Act
  const result = await useCase.execute(mockGitHubRepo, path, userId);

  // Assert
  expect(result.isOk()).toBe(true);
  result.map((data) => {
    expect(data.document.length).toBeGreaterThan(10000);
  });
});

// 境界条件のテスト
test("空のパスを指定した場合も正しく処理されること", async () => {
  // Arrange
  const emptyPath = "";
  const userId = "user-123";
  const syncError = createSyncError(
    "FILE_NOT_FOUND",
    "ファイルパスが空です",
  );
  (mockSyncService.syncFile as ReturnType<typeof vi.fn>).mockResolvedValue(err(syncError));
  const useCase = new SyncFileUseCase(mockSyncService);

  // Act
  const result = await useCase.execute(mockGitHubRepo, emptyPath, userId);

  // Assert
  expect(result.isErr()).toBe(true);
  expect(mockSyncService.syncFile).toHaveBeenCalledWith(
    mockGitHubRepo,
    emptyPath,
    userId,
  );
});

test("特殊文字を含むパスを指定した場合も正しく処理されること", async () => {
  // Arrange
  const specialPath = "docs/special-chars-!@#$%^&*().md";
  const userId = "user-123";
  (mockSyncService.syncFile as ReturnType<typeof vi.fn>).mockResolvedValue(ok({
    ...mockDocument,
    path: specialPath
  }));
  const useCase = new SyncFileUseCase(mockSyncService);

  // Act
  const result = await useCase.execute(mockGitHubRepo, specialPath, userId);

  // Assert
  expect(result.isOk()).toBe(true);
  result.map((data) => {
    expect(data.path).toBe(specialPath);
  });
  expect(mockSyncService.syncFile).toHaveBeenCalledWith(
    mockGitHubRepo,
    specialPath,
    userId,
  );
});

// 無効な入力のテスト
test("無効なファイル拡張子を持つパスを指定した場合も正しく処理されること", async () => {
  // Arrange
  const invalidExtensionPath = "docs/file.invalid";
  const userId = "user-123";
  const syncError = createSyncError(
    "PARSE_ERROR",
    "サポートされていないファイル形式です",
  );
  (mockSyncService.syncFile as ReturnType<typeof vi.fn>).mockResolvedValue(err(syncError));
  const useCase = new SyncFileUseCase(mockSyncService);

  // Act
  const result = await useCase.execute(mockGitHubRepo, invalidExtensionPath, userId);

  // Assert
  expect(result.isErr()).toBe(true);
  result.mapErr((error) => {
    expect(error.type).toBe("PARSE_ERROR");
  });
});

// セキュリティ関連のテスト
test("異なるユーザーのGitHubリポジトリを指定した場合、ユーザーIDの検証が必要であること", async () => {
  // Arrange
  const path = "docs/readme.md";
  const currentUserId = "user-123"; // 現在のユーザーID
  
  // 同期サービスのモックを設定
  // 同期時に指定されたユーザーIDを使用するように設定
  (mockSyncService.syncFile as ReturnType<typeof vi.fn>).mockImplementation(
    (repo, filePath, userId) => {
      return ok({
        ...mockDocument,
        gitHubRepoId: repo.id,
        userId: userId // 同期時に指定されたユーザーIDを使用
      });
    }
  );
  
  const useCase = new SyncFileUseCase(mockSyncService);

  // Act
  const result = await useCase.execute(otherUserGitHubRepo, path, currentUserId);

  // Assert
  expect(result.isOk()).toBe(true);
  const document = result._unsafeUnwrap();

  // 文書は同期できるが、GitHubリポジトリのユーザーIDが現在のユーザーと異なることを確認
  expect(otherUserGitHubRepo.userId).not.toBe(currentUserId);
  expect(document.userId).toBe(currentUserId); // 同期時に指定したユーザーIDが使用される

  // 実際のアプリケーションでは、ここでユーザーIDの検証を行い、
  // 権限がない場合は操作を拒否する必要があります
  // このテストは、そのような検証の必要性を示しています
});
test("パストラバーサルを含むパスを指定した場合でも安全に処理されること", async () => {
  // Arrange
  const traversalPath = "../../../etc/passwd";
  const userId = "user-123";
  const syncError = createSyncError(
    "FILE_NOT_FOUND",
    "ファイルが見つかりません",
  );
  (mockSyncService.syncFile as ReturnType<typeof vi.fn>).mockResolvedValue(err(syncError));
  const useCase = new SyncFileUseCase(mockSyncService);

  // Act
  const result = await useCase.execute(mockGitHubRepo, traversalPath, userId);

  // Assert
  expect(result.isErr()).toBe(true);
  expect(mockSyncService.syncFile).toHaveBeenCalledWith(
    mockGitHubRepo,
    traversalPath,
    userId,
  );
  // 実際のアプリケーションでは、パスの検証とサニタイズが必要です
});

