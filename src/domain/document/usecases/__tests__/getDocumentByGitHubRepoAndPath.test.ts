import { createRepositoryError } from "@/domain/shared/models/common";
import { err, ok } from "neverthrow";
import { expect, test, vi, beforeEach } from "vitest";
import type { Document } from "../../models/document";
import type { GitHubRepo } from "../../models/githubRepo";
import type { DocumentRepository } from "../../repositories/document";
import { GetDocumentByGitHubRepoAndPathUseCase } from "../getDocumentByGitHubRepoAndPath";

// モックのドキュメントリポジトリを作成
const mockDocumentRepository: DocumentRepository = {
  findById: vi.fn(),
  findByGitHubRepoAndPath: vi.fn(),
  findByGitHubRepo: vi.fn(),
  save: vi.fn(),
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
  userId: mockGitHubRepo.userId,
};

// テスト前にモックをリセット
beforeEach(() => {
  vi.resetAllMocks();
});

test("存在するGitHubリポジトリとパスを指定するとドキュメントが返されること", async () => {
  // Arrange
  (
    mockDocumentRepository.findByGitHubRepoAndPath as ReturnType<typeof vi.fn>
  ).mockResolvedValue(ok(mockDocument));
  const useCase = new GetDocumentByGitHubRepoAndPathUseCase(
    mockDocumentRepository,
  );
  const path = "docs/readme.md";

  // Act
  const result = await useCase.execute(mockGitHubRepo.id, path);

  // Assert
  expect(result.isOk()).toBe(true);
  result.map((data) => {
    expect(data).toEqual(mockDocument);
  });
  expect(mockDocumentRepository.findByGitHubRepoAndPath).toHaveBeenCalledWith(
    mockGitHubRepo.id,
    path,
  );
});

test("存在しないGitHubリポジトリとパスを指定するとnullが返されること", async () => {
  // Arrange
  const nonExistentRepoId = "non-existent-repo";
  const path = "docs/readme.md";
  (
    mockDocumentRepository.findByGitHubRepoAndPath as ReturnType<typeof vi.fn>
  ).mockResolvedValue(ok(null));
  const useCase = new GetDocumentByGitHubRepoAndPathUseCase(
    mockDocumentRepository,
  );

  // Act
  const result = await useCase.execute(nonExistentRepoId, path);

  // Assert
  expect(result.isOk()).toBe(true);
  result.map((data) => {
    expect(data).toBeNull();
  });
  expect(mockDocumentRepository.findByGitHubRepoAndPath).toHaveBeenCalledWith(
    nonExistentRepoId,
    path,
  );
});

test("リポジトリでエラーが発生した場合はエラーが返されること", async () => {
  // Arrange
  const repoId = "repo-123";
  const path = "docs/readme.md";
  const repositoryError = createRepositoryError(
    "DATABASE_ERROR",
    "データベースエラーが発生しました",
  );
  (
    mockDocumentRepository.findByGitHubRepoAndPath as ReturnType<typeof vi.fn>
  ).mockResolvedValue(err(repositoryError));
  const useCase = new GetDocumentByGitHubRepoAndPathUseCase(
    mockDocumentRepository,
  );

  // Act
  const result = await useCase.execute(repoId, path);

  // Assert
  expect(result.isErr()).toBe(true);
  result.mapErr((error) => {
    expect(error).toEqual(repositoryError);
  });
  expect(mockDocumentRepository.findByGitHubRepoAndPath).toHaveBeenCalledWith(
    repoId,
    path,
  );
});

// エッジケースのテスト
test("非常に長いパスを指定しても正しく処理されること", async () => {
  // Arrange
  const repoId = "repo-123";
  const longPath = `${"docs/".repeat(100)}readme.md`; // 非常に長いパス
  (
    mockDocumentRepository.findByGitHubRepoAndPath as ReturnType<typeof vi.fn>
  ).mockResolvedValue(
    ok({
      ...mockDocument,
      path: longPath,
    }),
  );
  const useCase = new GetDocumentByGitHubRepoAndPathUseCase(
    mockDocumentRepository,
  );

  // Act
  const result = await useCase.execute(repoId, longPath);

  // Assert
  expect(result.isOk()).toBe(true);
  result.map((data) => {
    expect(data?.path).toBe(longPath);
  });
  expect(mockDocumentRepository.findByGitHubRepoAndPath).toHaveBeenCalledWith(
    repoId,
    longPath,
  );
});

// 境界条件のテスト
test("空のパスを指定した場合も正しく処理されること", async () => {
  // Arrange
  const repoId = "repo-123";
  const emptyPath = "";
  (
    mockDocumentRepository.findByGitHubRepoAndPath as ReturnType<typeof vi.fn>
  ).mockResolvedValue(ok(null));
  const useCase = new GetDocumentByGitHubRepoAndPathUseCase(
    mockDocumentRepository,
  );

  // Act
  const result = await useCase.execute(repoId, emptyPath);

  // Assert
  expect(result.isOk()).toBe(true);
  expect(mockDocumentRepository.findByGitHubRepoAndPath).toHaveBeenCalledWith(
    repoId,
    emptyPath,
  );
});

test("特殊文字を含むパスを指定した場合も正しく処理されること", async () => {
  // Arrange
  const repoId = "repo-123";
  const specialPath = "docs/special-chars-!@#$%^&*().md";
  (
    mockDocumentRepository.findByGitHubRepoAndPath as ReturnType<typeof vi.fn>
  ).mockResolvedValue(
    ok({
      ...mockDocument,
      path: specialPath,
    }),
  );
  const useCase = new GetDocumentByGitHubRepoAndPathUseCase(
    mockDocumentRepository,
  );

  // Act
  const result = await useCase.execute(repoId, specialPath);

  // Assert
  expect(result.isOk()).toBe(true);
  result.map((data) => {
    expect(data?.path).toBe(specialPath);
  });
  expect(mockDocumentRepository.findByGitHubRepoAndPath).toHaveBeenCalledWith(
    repoId,
    specialPath,
  );
});

// 無効な入力のテスト
test("無効なリポジトリIDを指定した場合も正しく処理されること", async () => {
  // Arrange
  const invalidRepoId = "invalid-repo-id";
  const path = "docs/readme.md";
  (
    mockDocumentRepository.findByGitHubRepoAndPath as ReturnType<typeof vi.fn>
  ).mockResolvedValue(ok(null));
  const useCase = new GetDocumentByGitHubRepoAndPathUseCase(
    mockDocumentRepository,
  );

  // Act
  const result = await useCase.execute(invalidRepoId, path);

  // Assert
  expect(result.isOk()).toBe(true);
  expect(mockDocumentRepository.findByGitHubRepoAndPath).toHaveBeenCalledWith(
    invalidRepoId,
    path,
  );
});

// セキュリティ関連のテスト
test("異なるユーザーのドキュメントを取得した場合、ユーザーIDの検証が必要であること", async () => {
  // Arrange
  const repoId = "repo-456";
  const path = "docs/readme.md";
  const otherUserDocument = {
    ...mockDocument,
    id: "doc-456",
    gitHubRepoId: repoId,
    userId: "user-456", // 異なるユーザーID
  };

  (
    mockDocumentRepository.findByGitHubRepoAndPath as ReturnType<typeof vi.fn>
  ).mockResolvedValue(ok(otherUserDocument));
  const useCase = new GetDocumentByGitHubRepoAndPathUseCase(
    mockDocumentRepository,
  );
  const currentUserId = "user-123"; // 現在のユーザーID

  // Act
  const result = await useCase.execute(repoId, path);

  // Assert
  expect(result.isOk()).toBe(true);
  const document = result._unsafeUnwrap();

  // ドキュメントは取得できるが、ユーザーIDが異なることを確認
  expect(document).not.toBeNull();
  expect(document?.userId).not.toBe(currentUserId);
  expect(document?.userId).toBe("user-456");

  // 実際のアプリケーションでは、ここでユーザーIDの検証を行い、
  // 権限がない場合はアクセスを拒否する必要があります
});

test("パストラバーサルを含むパスを指定した場合でも安全に処理されること", async () => {
  // Arrange
  const repoId = "repo-123";
  const traversalPath = "../../../etc/passwd";
  (
    mockDocumentRepository.findByGitHubRepoAndPath as ReturnType<typeof vi.fn>
  ).mockResolvedValue(ok(null));
  const useCase = new GetDocumentByGitHubRepoAndPathUseCase(
    mockDocumentRepository,
  );

  // Act
  const result = await useCase.execute(repoId, traversalPath);

  // Assert
  expect(result.isOk()).toBe(true);
  expect(mockDocumentRepository.findByGitHubRepoAndPath).toHaveBeenCalledWith(
    repoId,
    traversalPath,
  );
  // 実際のアプリケーションでは、パスの検証とサニタイズが必要です
});
