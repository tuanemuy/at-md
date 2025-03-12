import { err, ok } from "neverthrow";
import { expect, test, vi, beforeEach } from "vitest";
import type { Document } from "../../models/document";
import { createSyncError } from "../../models/errors";
import type { GitHubRepo } from "../../models/githubRepo";
import type { SyncService } from "../../services/sync";
import { SyncAllFilesUseCase } from "../syncAllFiles";

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

// 別のユーザーのGitHubリポジトリデータ
const otherUserGitHubRepo: GitHubRepo = {
  ...mockGitHubRepo,
  id: "repo-456",
  owner: "otheruser",
  name: "other-repo",
  fullName: "otheruser/other-repo",
  userId: "user-456",
};

// テスト用のドキュメントデータ
const mockDocuments: Document[] = [
  {
    id: "doc-123",
    gitHubRepoId: mockGitHubRepo.id,
    path: "docs/readme.md",
    title: "README",
    document: "# Hello World",
    scope: "private",
    createdAt: new Date(),
    updatedAt: new Date(),
    userId: mockGitHubRepo.userId,
  },
  {
    id: "doc-456",
    gitHubRepoId: mockGitHubRepo.id,
    path: "docs/guide.md",
    title: "Guide",
    document: "# User Guide",
    scope: "private",
    createdAt: new Date(),
    updatedAt: new Date(),
    userId: mockGitHubRepo.userId,
  },
];

// テスト前にモックをリセット
beforeEach(() => {
  vi.resetAllMocks();
});

test("有効なパラメータを指定するとすべてのファイルが同期されて文書の配列が返されること", async () => {
  // Arrange
  (mockSyncService.syncAllFiles as ReturnType<typeof vi.fn>).mockResolvedValue(
    ok(mockDocuments),
  );
  const useCase = new SyncAllFilesUseCase(mockSyncService);
  const userId = "user-123";

  // Act
  const result = await useCase.execute(mockGitHubRepo, userId);

  // Assert
  expect(result.isOk()).toBe(true);
  result.map((data) => {
    expect(data).toEqual(mockDocuments);
    expect(data.length).toBe(2);
  });
  expect(mockSyncService.syncAllFiles).toHaveBeenCalledWith(
    mockGitHubRepo,
    userId,
  );
});

test("同期サービスでエラーが発生した場合はエラーが返されること", async () => {
  // Arrange
  const userId = "user-123";
  const syncError = createSyncError(
    "GITHUREPO_NOT_FOUND",
    "リポジトリが見つかりません",
  );
  (mockSyncService.syncAllFiles as ReturnType<typeof vi.fn>).mockResolvedValue(
    err(syncError),
  );
  const useCase = new SyncAllFilesUseCase(mockSyncService);

  // Act
  const result = await useCase.execute(mockGitHubRepo, userId);

  // Assert
  expect(result.isErr()).toBe(true);
  result.mapErr((error) => {
    expect(error).toEqual(syncError);
  });
  expect(mockSyncService.syncAllFiles).toHaveBeenCalledWith(
    mockGitHubRepo,
    userId,
  );
});

// エッジケースのテスト
test("非常に多くのファイルを同期できること", async () => {
  // Arrange
  const userId = "user-123";
  const manyDocuments = Array.from({ length: 100 }, (_, i) => ({
    ...mockDocuments[0],
    id: `doc-${i}`,
    path: `docs/file-${i}.md`,
    title: `File ${i}`,
  }));

  (mockSyncService.syncAllFiles as ReturnType<typeof vi.fn>).mockResolvedValue(
    ok(manyDocuments),
  );
  const useCase = new SyncAllFilesUseCase(mockSyncService);

  // Act
  const result = await useCase.execute(mockGitHubRepo, userId);

  // Assert
  expect(result.isOk()).toBe(true);
  result.map((data) => {
    expect(data.length).toBe(100);
    expect(data[99].path).toBe("docs/file-99.md");
  });
});

test("非常に大きなドキュメント内容を持つファイルを同期できること", async () => {
  // Arrange
  const userId = "user-123";
  const largeContent = `${"# ".repeat(10000)}Large Document`; // 非常に大きなドキュメント内容
  const documentsWithLargeContent = [
    {
      ...mockDocuments[0],
      id: "doc-1",
      path: "docs/large-file-1.md",
      document: largeContent,
    },
    {
      ...mockDocuments[1],
      id: "doc-2",
      path: "docs/large-file-2.md",
      document: largeContent,
    },
  ];

  (mockSyncService.syncAllFiles as ReturnType<typeof vi.fn>).mockResolvedValue(
    ok(documentsWithLargeContent),
  );
  const useCase = new SyncAllFilesUseCase(mockSyncService);

  // Act
  const result = await useCase.execute(mockGitHubRepo, userId);

  // Assert
  expect(result.isOk()).toBe(true);
  result.map((documents) => {
    expect(documents.length).toBe(2);
    expect(documents[0].document.length).toBeGreaterThan(10000);
    expect(documents[1].document.length).toBeGreaterThan(10000);
  });
});

// 境界条件のテスト
test("空のドキュメント配列が返された場合も正しく処理されること", async () => {
  // Arrange
  const userId = "user-123";
  const emptyDocuments: Document[] = [];

  (mockSyncService.syncAllFiles as ReturnType<typeof vi.fn>).mockResolvedValue(
    ok(emptyDocuments),
  );
  const useCase = new SyncAllFilesUseCase(mockSyncService);

  // Act
  const result = await useCase.execute(mockGitHubRepo, userId);

  // Assert
  expect(result.isOk()).toBe(true);
  result.map((data) => {
    expect(data).toEqual([]);
    expect(data.length).toBe(0);
  });
});

test("様々なスコープを持つドキュメントを同期できること", async () => {
  // Arrange
  const userId = "user-123";
  const mixedScopeDocuments = [
    {
      ...mockDocuments[0],
      scope: "private",
    },
    {
      ...mockDocuments[1],
      scope: "public",
    },
    {
      ...mockDocuments[0],
      id: "doc-789",
      path: "docs/internal.md",
      title: "Internal",
      scope: "internal",
    },
  ];

  (mockSyncService.syncAllFiles as ReturnType<typeof vi.fn>).mockResolvedValue(
    ok(mixedScopeDocuments),
  );
  const useCase = new SyncAllFilesUseCase(mockSyncService);

  // Act
  const result = await useCase.execute(mockGitHubRepo, userId);

  // Assert
  expect(result.isOk()).toBe(true);
  result.map((data) => {
    expect(data.length).toBe(3);
    expect(data[0].scope).toBe("private");
    expect(data[1].scope).toBe("public");
    expect(data[2].scope).toBe("internal");
  });
});

// セキュリティ関連のテスト
test("異なるユーザーのGitHubリポジトリを指定した場合、ユーザーIDの検証が必要であること", async () => {
  // Arrange
  const currentUserId = "user-123"; // 現在のユーザーID

  // 同期サービスのモックを設定
  // 同期時に指定されたユーザーIDを使用するように設定
  (mockSyncService.syncAllFiles as ReturnType<typeof vi.fn>).mockImplementation(
    (repo, userId) => {
      return ok([
        {
          ...mockDocuments[0],
          id: "doc-1",
          gitHubRepoId: repo.id,
          path: "file1.md",
          userId: userId, // 同期時に指定されたユーザーIDを使用
        },
        {
          ...mockDocuments[1],
          id: "doc-2",
          gitHubRepoId: repo.id,
          path: "file2.md",
          userId: userId, // 同期時に指定されたユーザーIDを使用
        },
      ]);
    },
  );

  const useCase = new SyncAllFilesUseCase(mockSyncService);

  // Act
  const result = await useCase.execute(otherUserGitHubRepo, currentUserId);

  // Assert
  expect(result.isOk()).toBe(true);
  const documents = result._unsafeUnwrap();

  // 文書は同期できるが、GitHubリポジトリのユーザーIDが現在のユーザーと異なることを確認
  expect(otherUserGitHubRepo.userId).not.toBe(currentUserId);
  for (const doc of documents) {
    expect(doc.userId).toBe(currentUserId); // 同期時に指定したユーザーIDが使用される
  }

  // 実際のアプリケーションでは、ここでユーザーIDの検証を行い、
  // 権限がない場合は操作を拒否する必要があります
  // このテストは、そのような検証の必要性を示しています
});

test("XSSインジェクションを含むファイル内容を同期できること", async () => {
  // Arrange
  const userId = "user-123";
  const xssContent = "# Hello World\n<script>alert('XSS')</script>";
  const documentsWithXss = [
    {
      ...mockDocuments[0],
      document: xssContent,
    },
  ];

  (mockSyncService.syncAllFiles as ReturnType<typeof vi.fn>).mockResolvedValue(
    ok(documentsWithXss),
  );
  const useCase = new SyncAllFilesUseCase(mockSyncService);

  // Act
  const result = await useCase.execute(mockGitHubRepo, userId);

  // Assert
  expect(result.isOk()).toBe(true);
  result.map((data) => {
    expect(data[0].document).toContain("<script>");
  });
  // 実際のアプリケーションでは、出力時にエスケープ処理またはサニタイズが必要です
});

test("SQLインジェクションを含むファイル内容を同期できること", async () => {
  // Arrange
  const userId = "user-123";
  const sqlInjectionContent = "# Hello World\n'; DROP TABLE users; --";
  const documentsWithSqlInjection = [
    {
      ...mockDocuments[0],
      document: sqlInjectionContent,
    },
  ];

  (mockSyncService.syncAllFiles as ReturnType<typeof vi.fn>).mockResolvedValue(
    ok(documentsWithSqlInjection),
  );
  const useCase = new SyncAllFilesUseCase(mockSyncService);

  // Act
  const result = await useCase.execute(mockGitHubRepo, userId);

  // Assert
  expect(result.isOk()).toBe(true);
  result.map((data) => {
    expect(data[0].document).toContain("DROP TABLE");
  });
  // 実際のアプリケーションでは、データベースアクセス時にパラメータ化クエリを使用するなど
  // 適切な対策が必要です
});
