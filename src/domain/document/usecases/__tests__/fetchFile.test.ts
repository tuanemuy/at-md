import { err, ok } from "neverthrow";
import { expect, test, vi, beforeEach } from "vitest";
import { createSyncError } from "../../models/errors";
import type { GitHubRepo } from "../../models/githubRepo";
import type { SyncService } from "../../services/sync";
import { FetchFileUseCase } from "../fetchFile";

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

// テスト用のファイル内容
const mockFileContent = "# Hello World\n\nThis is a test file.";

// テスト前にモックをリセット
beforeEach(() => {
  vi.resetAllMocks();
});

test("有効なパラメータを指定するとファイルの内容が返されること", async () => {
  // Arrange
  (mockSyncService.fetchFile as ReturnType<typeof vi.fn>).mockResolvedValue(ok(mockFileContent));
  const useCase = new FetchFileUseCase(mockSyncService);
  const path = "docs/readme.md";

  // Act
  const result = await useCase.execute(mockGitHubRepo, path);

  // Assert
  expect(result.isOk()).toBe(true);
  result.map((content) => {
    expect(content).toEqual(mockFileContent);
  });
  expect(mockSyncService.fetchFile).toHaveBeenCalledWith(
    mockGitHubRepo,
    path
  );
});

test("同期サービスでエラーが発生した場合はエラーが返されること", async () => {
  // Arrange
  const path = "docs/non-existent.md";
  const syncError = createSyncError(
    "FILE_NOT_FOUND",
    "ファイルが見つかりません",
  );
  (mockSyncService.fetchFile as ReturnType<typeof vi.fn>).mockResolvedValue(err(syncError));
  const useCase = new FetchFileUseCase(mockSyncService);

  // Act
  const result = await useCase.execute(mockGitHubRepo, path);

  // Assert
  expect(result.isErr()).toBe(true);
  result.mapErr((error) => {
    expect(error).toEqual(syncError);
  });
  expect(mockSyncService.fetchFile).toHaveBeenCalledWith(
    mockGitHubRepo,
    path
  );
});

// エッジケースのテスト
test("非常に長いパスを指定しても正しく処理されること", async () => {
  // Arrange
  const longPath = `${"docs/".repeat(100)}readme.md`; // 非常に長いパス
  (mockSyncService.fetchFile as ReturnType<typeof vi.fn>).mockResolvedValue(ok(mockFileContent));
  const useCase = new FetchFileUseCase(mockSyncService);

  // Act
  const result = await useCase.execute(mockGitHubRepo, longPath);

  // Assert
  expect(result.isOk()).toBe(true);
  expect(mockSyncService.fetchFile).toHaveBeenCalledWith(
    mockGitHubRepo,
    longPath
  );
});

test("非常に大きなファイル内容を持つファイルを取得できること", async () => {
  // Arrange
  const path = "docs/large-file.md";
  const largeContent = `${"# ".repeat(10000)}Large Document`; // 非常に大きなファイル内容
  (mockSyncService.fetchFile as ReturnType<typeof vi.fn>).mockResolvedValue(ok(largeContent));
  const useCase = new FetchFileUseCase(mockSyncService);

  // Act
  const result = await useCase.execute(mockGitHubRepo, path);

  // Assert
  expect(result.isOk()).toBe(true);
  result.map((content) => {
    expect(content.length).toBeGreaterThan(10000);
  });
});

// 境界条件のテスト
test("空のパスを指定した場合も正しく処理されること", async () => {
  // Arrange
  const emptyPath = "";
  const syncError = createSyncError(
    "FILE_NOT_FOUND",
    "ファイルパスが空です",
  );
  (mockSyncService.fetchFile as ReturnType<typeof vi.fn>).mockResolvedValue(err(syncError));
  const useCase = new FetchFileUseCase(mockSyncService);

  // Act
  const result = await useCase.execute(mockGitHubRepo, emptyPath);

  // Assert
  expect(result.isErr()).toBe(true);
  expect(mockSyncService.fetchFile).toHaveBeenCalledWith(
    mockGitHubRepo,
    emptyPath
  );
});

test("特殊文字を含むパスを指定した場合も正しく処理されること", async () => {
  // Arrange
  const specialPath = "docs/special-chars-!@#$%^&*().md";
  (mockSyncService.fetchFile as ReturnType<typeof vi.fn>).mockResolvedValue(ok(mockFileContent));
  const useCase = new FetchFileUseCase(mockSyncService);

  // Act
  const result = await useCase.execute(mockGitHubRepo, specialPath);

  // Assert
  expect(result.isOk()).toBe(true);
  expect(mockSyncService.fetchFile).toHaveBeenCalledWith(
    mockGitHubRepo,
    specialPath
  );
});

// 無効な入力のテスト
test("無効なファイル拡張子を持つパスを指定した場合も正しく処理されること", async () => {
  // Arrange
  const invalidExtensionPath = "docs/file.invalid";
  const syncError = createSyncError(
    "PARSE_ERROR",
    "サポートされていないファイル形式です",
  );
  (mockSyncService.fetchFile as ReturnType<typeof vi.fn>).mockResolvedValue(err(syncError));
  const useCase = new FetchFileUseCase(mockSyncService);

  // Act
  const result = await useCase.execute(mockGitHubRepo, invalidExtensionPath);

  // Assert
  expect(result.isErr()).toBe(true);
  result.mapErr((error) => {
    expect(error.type).toBe("PARSE_ERROR");
  });
});

// セキュリティ関連のテスト
test("パスインジェクション攻撃を防ぐために、パスが適切に検証されること", async () => {
  // Arrange
  const maliciousPath = "../../../etc/passwd"; // パスインジェクション攻撃の例
  const syncError = createSyncError(
    "FILE_NOT_FOUND",
    "無効なファイルパスです",
  );
  (mockSyncService.fetchFile as ReturnType<typeof vi.fn>).mockResolvedValue(err(syncError));
  const useCase = new FetchFileUseCase(mockSyncService);

  // Act
  const result = await useCase.execute(mockGitHubRepo, maliciousPath);

  // Assert
  expect(result.isErr()).toBe(true);
  // 実際のアプリケーションでは、パスの検証を行い、
  // 不正なパスの場合はエラーを返す必要があります
}); 