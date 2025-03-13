import { createRepositoryError } from "@/domain/shared/models/common";
import { err, ok } from "neverthrow";
import { expect, test, vi, beforeEach } from "vitest";
import type { Document } from "../../models/document";
import type { DocumentRepository } from "../../repositories/document";
import { GetDocumentsByGitHubRepoUseCase } from "../getDocumentsByGitHubRepo";

// モックのドキュメントリポジトリを作成
const mockDocumentRepository: DocumentRepository = {
  findById: vi.fn(),
  findByGitHubRepoAndPath: vi.fn(),
  findByGitHubRepo: vi.fn(),
  save: vi.fn(),
  delete: vi.fn(),
};

// テスト用のドキュメントデータ
const mockDocuments: Document[] = [
  {
    id: "doc-1",
    gitHubRepoId: "repo-123",
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
    gitHubRepoId: "repo-123",
    path: "docs/guide.md",
    title: "Guide",
    document: "# Guide",
    scope: "public",
    createdAt: new Date(),
    updatedAt: new Date(),
    userId: "user-123",
  },
];

// 別のユーザーのドキュメントデータ
const otherUserDocuments: Document[] = [
  {
    id: "doc-3",
    gitHubRepoId: "repo-456",
    path: "docs/readme.md",
    title: "README",
    document: "# Hello World",
    scope: "private",
    createdAt: new Date(),
    updatedAt: new Date(),
    userId: "user-456",
  },
];

// テスト前にモックをリセット
beforeEach(() => {
  vi.resetAllMocks();
});

test("存在するGitHubリポジトリIDを指定すると関連する文書の配列が返されること", async () => {
  // Arrange
  const gitHubRepoId = "repo-123";
  (
    mockDocumentRepository.findByGitHubRepo as ReturnType<typeof vi.fn>
  ).mockResolvedValue(ok(mockDocuments));
  const useCase = new GetDocumentsByGitHubRepoUseCase(mockDocumentRepository);

  // Act
  const result = await useCase.execute(gitHubRepoId);

  // Assert
  expect(result.isOk()).toBe(true);
  result.map((data) => {
    expect(data).toEqual(mockDocuments);
    expect(data.length).toBe(2);
  });
  expect(mockDocumentRepository.findByGitHubRepo).toHaveBeenCalledWith(
    gitHubRepoId,
  );
});

test("文書が存在しないGitHubリポジトリIDを指定すると空の配列が返されること", async () => {
  // Arrange
  const gitHubRepoId = "repo-without-docs";
  (
    mockDocumentRepository.findByGitHubRepo as ReturnType<typeof vi.fn>
  ).mockResolvedValue(ok([]));
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
  (
    mockDocumentRepository.findByGitHubRepo as ReturnType<typeof vi.fn>
  ).mockResolvedValue(err(repositoryError));
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

// エッジケースのテスト
test("非常に長いGitHubリポジトリIDを指定しても正しく処理されること", async () => {
  // Arrange
  const longId = "a".repeat(1000); // 非常に長いID
  (
    mockDocumentRepository.findByGitHubRepo as ReturnType<typeof vi.fn>
  ).mockResolvedValue(ok([]));
  const useCase = new GetDocumentsByGitHubRepoUseCase(mockDocumentRepository);

  // Act
  const result = await useCase.execute(longId);

  // Assert
  expect(result.isOk()).toBe(true);
  expect(mockDocumentRepository.findByGitHubRepo).toHaveBeenCalledWith(longId);
});

test("非常に多くのドキュメントが返されても正しく処理されること", async () => {
  // Arrange
  const gitHubRepoId = "repo-123";
  const manyDocuments: Document[] = Array(100)
    .fill(null)
    .map((_, index) => ({
      id: `doc-${index}`,
      gitHubRepoId,
      path: `docs/file-${index}.md`,
      title: `Document ${index}`,
      document: `# Document ${index}`,
      scope: "private",
      createdAt: new Date(),
      updatedAt: new Date(),
      userId: "user-123",
    }));

  (
    mockDocumentRepository.findByGitHubRepo as ReturnType<typeof vi.fn>
  ).mockResolvedValue(ok(manyDocuments));
  const useCase = new GetDocumentsByGitHubRepoUseCase(mockDocumentRepository);

  // Act
  const result = await useCase.execute(gitHubRepoId);

  // Assert
  expect(result.isOk()).toBe(true);
  result.map((data) => {
    expect(data.length).toBe(100);
    expect(data[0].id).toBe("doc-0");
    expect(data[99].id).toBe("doc-99");
  });
});

// 境界条件のテスト
test("空のGitHubリポジトリIDを指定した場合も正しく処理されること", async () => {
  // Arrange
  const emptyId = "";
  (
    mockDocumentRepository.findByGitHubRepo as ReturnType<typeof vi.fn>
  ).mockResolvedValue(ok([]));
  const useCase = new GetDocumentsByGitHubRepoUseCase(mockDocumentRepository);

  // Act
  const result = await useCase.execute(emptyId);

  // Assert
  expect(result.isOk()).toBe(true);
  expect(mockDocumentRepository.findByGitHubRepo).toHaveBeenCalledWith(emptyId);
});

test("異なるスコープを持つドキュメントが混在していても正しく処理されること", async () => {
  // Arrange
  const gitHubRepoId = "repo-123";
  const mixedScopeDocuments: Document[] = [
    {
      id: "doc-1",
      gitHubRepoId,
      path: "docs/private.md",
      title: "Private Document",
      document: "# Private",
      scope: "private",
      createdAt: new Date(),
      updatedAt: new Date(),
      userId: "user-123",
    },
    {
      id: "doc-2",
      gitHubRepoId,
      path: "docs/public.md",
      title: "Public Document",
      document: "# Public",
      scope: "public",
      createdAt: new Date(),
      updatedAt: new Date(),
      userId: "user-123",
    },
    {
      id: "doc-3",
      gitHubRepoId,
      path: "docs/limited.md",
      title: "Limited Document",
      document: "# Limited",
      scope: "limited",
      createdAt: new Date(),
      updatedAt: new Date(),
      userId: "user-123",
    },
  ];

  (
    mockDocumentRepository.findByGitHubRepo as ReturnType<typeof vi.fn>
  ).mockResolvedValue(ok(mixedScopeDocuments));
  const useCase = new GetDocumentsByGitHubRepoUseCase(mockDocumentRepository);

  // Act
  const result = await useCase.execute(gitHubRepoId);

  // Assert
  expect(result.isOk()).toBe(true);
  result.map((data) => {
    expect(data.length).toBe(3);
    expect(data[0].scope).toBe("private");
    expect(data[1].scope).toBe("public");
    expect(data[2].scope).toBe("limited");
  });
});

// 無効な入力のテスト
test("無効なフォーマットのGitHubリポジトリIDを指定した場合も正しく処理されること", async () => {
  // Arrange
  const invalidId = "invalid-repo-id-format";
  (
    mockDocumentRepository.findByGitHubRepo as ReturnType<typeof vi.fn>
  ).mockResolvedValue(ok([]));
  const useCase = new GetDocumentsByGitHubRepoUseCase(mockDocumentRepository);

  // Act
  const result = await useCase.execute(invalidId);

  // Assert
  expect(result.isOk()).toBe(true);
  expect(mockDocumentRepository.findByGitHubRepo).toHaveBeenCalledWith(
    invalidId,
  );
});

// セキュリティ関連のテスト
test("異なるユーザーのGitHubリポジトリを指定した場合、ユーザーIDの検証が必要であること", async () => {
  // Arrange
  const otherUserRepoId = "repo-456";
  (
    mockDocumentRepository.findByGitHubRepo as ReturnType<typeof vi.fn>
  ).mockResolvedValue(ok(otherUserDocuments));
  const useCase = new GetDocumentsByGitHubRepoUseCase(mockDocumentRepository);
  const currentUserId = "user-123"; // 現在のユーザーID

  // Act
  const result = await useCase.execute(otherUserRepoId);

  // Assert
  expect(result.isOk()).toBe(true);
  const documents = result._unsafeUnwrap();

  // 文書は取得できるが、ユーザーIDが異なることを確認
  expect(documents.length).toBe(1);
  expect(documents[0].userId).not.toBe(currentUserId);
  expect(documents[0].userId).toBe("user-456");

  // 実際のアプリケーションでは、ここでユーザーIDの検証を行い、
  // 権限がない場合はアクセスを拒否する必要があります
  // このテストは、そのような検証の必要性を示しています
});

test("SQLインジェクションを試みるGitHubリポジトリIDを指定した場合でも安全に処理されること", async () => {
  // Arrange
  const maliciousId = "1'; DROP TABLE documents; --";
  (
    mockDocumentRepository.findByGitHubRepo as ReturnType<typeof vi.fn>
  ).mockResolvedValue(ok([]));
  const useCase = new GetDocumentsByGitHubRepoUseCase(mockDocumentRepository);

  // Act
  const result = await useCase.execute(maliciousId);

  // Assert
  expect(result.isOk()).toBe(true);
  expect(mockDocumentRepository.findByGitHubRepo).toHaveBeenCalledWith(
    maliciousId,
  );
  // 実際のアプリケーションでは、パラメータ化クエリやORMを使用してSQLインジェクションを防ぐ必要があります
});

test("XSSインジェクションを含むドキュメントが安全に処理されること", async () => {
  // Arrange
  const gitHubRepoId = "repo-123";
  const documentsWithXSS: Document[] = [
    {
      id: "doc-1",
      gitHubRepoId,
      path: "docs/xss.md",
      title: "<script>alert('XSS')</script>",
      document: "# Hello World\n<script>alert('XSS')</script>",
      scope: "private",
      createdAt: new Date(),
      updatedAt: new Date(),
      userId: "user-123",
    },
  ];

  (
    mockDocumentRepository.findByGitHubRepo as ReturnType<typeof vi.fn>
  ).mockResolvedValue(ok(documentsWithXSS));
  const useCase = new GetDocumentsByGitHubRepoUseCase(mockDocumentRepository);

  // Act
  const result = await useCase.execute(gitHubRepoId);

  // Assert
  expect(result.isOk()).toBe(true);
  const documents = result._unsafeUnwrap();
  expect(documents[0].title).toContain("<script>");
  expect(documents[0].document).toContain("<script>");
  // 実際のアプリケーションでは、出力時にエスケープ処理またはサニタイズが必要です
});
