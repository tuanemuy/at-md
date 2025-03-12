import { createRepositoryError } from "@/domain/shared/models/common";
import { err, ok } from "neverthrow";
import { expect, test, vi, beforeEach } from "vitest";
import type { GitHubRepo } from "../../models/githubRepo";
import type { GitHubRepoRepository } from "../../repositories/githubRepo";
import { GetGitHubRepoUseCase } from "../getGitHubRepo";

// モックのGitHubリポジトリリポジトリを作成
const mockGitHubRepoRepository: GitHubRepoRepository = {
  findById: vi.fn(),
  findByFullName: vi.fn(),
  findByUserId: vi.fn(),
  save: vi.fn()
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

// テスト前にモックをリセット
beforeEach(() => {
  vi.resetAllMocks();
});

test("存在するリポジトリIDを指定するとリポジトリが返されること", async () => {
  // Arrange
  (mockGitHubRepoRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(ok(mockGitHubRepo));
  const useCase = new GetGitHubRepoUseCase(mockGitHubRepoRepository);

  // Act
  const result = await useCase.execute(mockGitHubRepo.id);

  // Assert
  expect(result.isOk()).toBe(true);
  result.map((data) => {
    expect(data).toEqual(mockGitHubRepo);
  });
  expect(mockGitHubRepoRepository.findById).toHaveBeenCalledWith(mockGitHubRepo.id);
});

test("存在しないリポジトリIDを指定するとnullが返されること", async () => {
  // Arrange
  const repoId = "non-existent-id";
  (mockGitHubRepoRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(ok(null));
  const useCase = new GetGitHubRepoUseCase(mockGitHubRepoRepository);

  // Act
  const result = await useCase.execute(repoId);

  // Assert
  expect(result.isOk()).toBe(true);
  result.map((data) => {
    expect(data).toBeNull();
  });
  expect(mockGitHubRepoRepository.findById).toHaveBeenCalledWith(repoId);
});

test("リポジトリでエラーが発生した場合はエラーが返されること", async () => {
  // Arrange
  const repoId = "repo-123";
  const repositoryError = createRepositoryError(
    "DATABASE_ERROR",
    "データベースエラーが発生しました",
  );
  (mockGitHubRepoRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(err(repositoryError));
  const useCase = new GetGitHubRepoUseCase(mockGitHubRepoRepository);

  // Act
  const result = await useCase.execute(repoId);

  // Assert
  expect(result.isErr()).toBe(true);
  result.mapErr((error) => {
    expect(error).toEqual(repositoryError);
  });
  expect(mockGitHubRepoRepository.findById).toHaveBeenCalledWith(repoId);
});

// エッジケースのテスト
test("非常に長いIDを指定しても正しく処理されること", async () => {
  // Arrange
  const longId = "a".repeat(1000); // 非常に長いID
  (mockGitHubRepoRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(ok(null));
  const useCase = new GetGitHubRepoUseCase(mockGitHubRepoRepository);

  // Act
  const result = await useCase.execute(longId);

  // Assert
  expect(result.isOk()).toBe(true);
  expect(mockGitHubRepoRepository.findById).toHaveBeenCalledWith(longId);
});

// 境界条件のテスト
test("空のIDを指定した場合も正しく処理されること", async () => {
  // Arrange
  const emptyId = "";
  (mockGitHubRepoRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(ok(null));
  const useCase = new GetGitHubRepoUseCase(mockGitHubRepoRepository);

  // Act
  const result = await useCase.execute(emptyId);

  // Assert
  expect(result.isOk()).toBe(true);
  expect(mockGitHubRepoRepository.findById).toHaveBeenCalledWith(emptyId);
});

// 無効な入力のテスト
test("無効なフォーマットのIDを指定した場合も正しく処理されること", async () => {
  // Arrange
  const invalidId = "invalid-id-format";
  (mockGitHubRepoRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(ok(null));
  const useCase = new GetGitHubRepoUseCase(mockGitHubRepoRepository);

  // Act
  const result = await useCase.execute(invalidId);

  // Assert
  expect(result.isOk()).toBe(true);
  expect(mockGitHubRepoRepository.findById).toHaveBeenCalledWith(invalidId);
});

// セキュリティ関連のテスト
test("異なるユーザーのリポジトリを取得した場合、ユーザーIDの検証が必要であること", async () => {
  // Arrange
  const otherUserRepo: GitHubRepo = {
    ...mockGitHubRepo,
    id: "repo-456",
    userId: "user-456"
  };
  (mockGitHubRepoRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(ok(otherUserRepo));
  const useCase = new GetGitHubRepoUseCase(mockGitHubRepoRepository);
  const currentUserId = "user-123"; // 現在のユーザーID

  // Act
  const result = await useCase.execute("repo-456");

  // Assert
  expect(result.isOk()).toBe(true);
  const repo = result._unsafeUnwrap();

  // リポジトリは取得できるが、ユーザーIDが異なることを確認
  expect(repo).not.toBeNull();
  expect(repo?.userId).not.toBe(currentUserId);
  expect(repo?.userId).toBe("user-456");

  // 実際のアプリケーションでは、ここでユーザーIDの検証を行い、
  // 権限がない場合はアクセスを拒否する必要があります
}); 