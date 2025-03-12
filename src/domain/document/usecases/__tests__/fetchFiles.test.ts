import { err, ok } from "neverthrow";
import { expect, test, vi, beforeEach } from "vitest";
import { createSyncError } from "../../models/errors";
import type { GitHubRepo } from "../../models/githubRepo";
import type { SyncService } from "../../services/sync";
import { FetchFilesUseCase } from "../fetchFiles";

// モックの同期サービスを作成
const mockSyncService: SyncService = {
  fetchFile: vi.fn(),
  fetchFiles: vi.fn(),
  syncFile: vi.fn(),
  syncAllFiles: vi.fn(),
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
  userId: "user-123",
};

// テスト用のファイルパス一覧
const mockFilePaths = [
  "README.md",
  "docs/getting-started.md",
  "docs/api-reference.md",
  "src/index.js",
];

// テスト前にモックをリセット
beforeEach(() => {
  vi.resetAllMocks();
});

test("有効なパラメータを指定するとファイル一覧が返されること", async () => {
  // Arrange
  (mockSyncService.fetchFiles as ReturnType<typeof vi.fn>).mockResolvedValue(
    ok(mockFilePaths),
  );
  const useCase = new FetchFilesUseCase(mockSyncService);

  // Act
  const result = await useCase.execute(mockGitHubRepo);

  // Assert
  expect(result.isOk()).toBe(true);
  result.map((paths) => {
    expect(paths).toEqual(mockFilePaths);
    expect(paths.length).toBe(4);
  });
  expect(mockSyncService.fetchFiles).toHaveBeenCalledWith(mockGitHubRepo);
});

test("同期サービスでエラーが発生した場合はエラーが返されること", async () => {
  // Arrange
  const syncError = createSyncError(
    "API_ERROR",
    "GitHubリポジトリからファイル一覧を取得できません",
  );
  (mockSyncService.fetchFiles as ReturnType<typeof vi.fn>).mockResolvedValue(
    err(syncError),
  );
  const useCase = new FetchFilesUseCase(mockSyncService);

  // Act
  const result = await useCase.execute(mockGitHubRepo);

  // Assert
  expect(result.isErr()).toBe(true);
  result.mapErr((error) => {
    expect(error).toEqual(syncError);
  });
  expect(mockSyncService.fetchFiles).toHaveBeenCalledWith(mockGitHubRepo);
});

// エッジケースのテスト
test("空のファイル一覧が返された場合も正しく処理されること", async () => {
  // Arrange
  const emptyFilePaths: string[] = [];
  (mockSyncService.fetchFiles as ReturnType<typeof vi.fn>).mockResolvedValue(
    ok(emptyFilePaths),
  );
  const useCase = new FetchFilesUseCase(mockSyncService);

  // Act
  const result = await useCase.execute(mockGitHubRepo);

  // Assert
  expect(result.isOk()).toBe(true);
  result.map((paths) => {
    expect(paths).toEqual(emptyFilePaths);
    expect(paths.length).toBe(0);
  });
});

test("非常に多くのファイルパスが返された場合も正しく処理されること", async () => {
  // Arrange
  const manyFilePaths = Array.from({ length: 1000 }, (_, i) => `file-${i}.md`);
  (mockSyncService.fetchFiles as ReturnType<typeof vi.fn>).mockResolvedValue(
    ok(manyFilePaths),
  );
  const useCase = new FetchFilesUseCase(mockSyncService);

  // Act
  const result = await useCase.execute(mockGitHubRepo);

  // Assert
  expect(result.isOk()).toBe(true);
  result.map((paths) => {
    expect(paths.length).toBe(1000);
  });
});

// 境界条件のテスト
test("非常に長いファイルパスを含む一覧も正しく処理されること", async () => {
  // Arrange
  const longPath = `${"docs/".repeat(100)}readme.md`; // 非常に長いパス
  const pathsWithLongPath = [...mockFilePaths, longPath];
  (mockSyncService.fetchFiles as ReturnType<typeof vi.fn>).mockResolvedValue(
    ok(pathsWithLongPath),
  );
  const useCase = new FetchFilesUseCase(mockSyncService);

  // Act
  const result = await useCase.execute(mockGitHubRepo);

  // Assert
  expect(result.isOk()).toBe(true);
  result.map((paths) => {
    expect(paths).toContain(longPath);
    expect(paths.length).toBe(5);
  });
});

// セキュリティ関連のテスト
test("様々な特殊文字や形式を含むファイルパスが返された場合も正しく処理されること", async () => {
  // Arrange
  const specialPaths = [
    "file with spaces.md",
    "file-with-!@#$%^&*().md",
    "日本語ファイル名.md",
    "emoji-😀-file.md",
    "../../../etc/passwd", // パストラバーサルの例
    "/etc/shadow", // 絶対パスの例
    "../../config.json", // 相対パスの例
  ];
  (mockSyncService.fetchFiles as ReturnType<typeof vi.fn>).mockResolvedValue(
    ok(specialPaths),
  );
  const useCase = new FetchFilesUseCase(mockSyncService);

  // Act
  const result = await useCase.execute(mockGitHubRepo);

  // Assert
  expect(result.isOk()).toBe(true);
  result.map((paths) => {
    expect(paths).toEqual(specialPaths);
    expect(paths.length).toBe(7);
  });
  // 実際のアプリケーションでは、パスの検証を行い、
  // 不正なパスをフィルタリングする必要があります
});
