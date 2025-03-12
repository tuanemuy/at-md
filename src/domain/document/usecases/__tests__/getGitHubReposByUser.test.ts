import { createRepositoryError } from "@/domain/shared/models/common";
import { err, ok } from "neverthrow";
import { expect, test, vi, beforeEach } from "vitest";
import type { GitHubRepo } from "../../models/githubRepo";
import type { GitHubRepoRepository } from "../../repositories/githubRepo";
import { GetGitHubReposByUserUseCase } from "../getGitHubReposByUser";

// モックのGitHubリポジトリリポジトリを作成
const mockGitHubRepoRepository: GitHubRepoRepository = {
  findById: vi.fn(),
  findByFullName: vi.fn(),
  findByUserId: vi.fn(),
  save: vi.fn(),
};

// テスト用のGitHubリポジトリデータ
const mockGitHubRepos: GitHubRepo[] = [
  {
    id: "repo-123",
    owner: "octocat",
    name: "hello-world",
    fullName: "octocat/hello-world",
    installationId: "inst-123",
    createdAt: new Date(),
    updatedAt: new Date(),
    userId: "user-123",
  },
  {
    id: "repo-456",
    owner: "octocat",
    name: "test-repo",
    fullName: "octocat/test-repo",
    installationId: "inst-123",
    createdAt: new Date(),
    updatedAt: new Date(),
    userId: "user-123",
  },
];

// テスト前にモックをリセット
beforeEach(() => {
  vi.resetAllMocks();
});

test("有効なユーザーIDを指定するとリポジトリの配列が返されること", async () => {
  // Arrange
  const userId = "user-123";
  (
    mockGitHubRepoRepository.findByUserId as ReturnType<typeof vi.fn>
  ).mockResolvedValue(ok(mockGitHubRepos));
  const useCase = new GetGitHubReposByUserUseCase(mockGitHubRepoRepository);

  // Act
  const result = await useCase.execute(userId);

  // Assert
  expect(result.isOk()).toBe(true);
  result.map((data) => {
    expect(data).toEqual(mockGitHubRepos);
    expect(data.length).toBe(2);
  });
  expect(mockGitHubRepoRepository.findByUserId).toHaveBeenCalledWith(userId);
});

test("存在しないユーザーIDを指定すると空の配列が返されること", async () => {
  // Arrange
  const userId = "non-existent-user";
  (
    mockGitHubRepoRepository.findByUserId as ReturnType<typeof vi.fn>
  ).mockResolvedValue(ok([]));
  const useCase = new GetGitHubReposByUserUseCase(mockGitHubRepoRepository);

  // Act
  const result = await useCase.execute(userId);

  // Assert
  expect(result.isOk()).toBe(true);
  result.map((data) => {
    expect(data).toEqual([]);
    expect(data.length).toBe(0);
  });
  expect(mockGitHubRepoRepository.findByUserId).toHaveBeenCalledWith(userId);
});

test("リポジトリでエラーが発生した場合はエラーが返されること", async () => {
  // Arrange
  const userId = "user-123";
  const repositoryError = createRepositoryError(
    "DATABASE_ERROR",
    "データベースエラーが発生しました",
  );
  (
    mockGitHubRepoRepository.findByUserId as ReturnType<typeof vi.fn>
  ).mockResolvedValue(err(repositoryError));
  const useCase = new GetGitHubReposByUserUseCase(mockGitHubRepoRepository);

  // Act
  const result = await useCase.execute(userId);

  // Assert
  expect(result.isErr()).toBe(true);
  result.mapErr((error) => {
    expect(error).toEqual(repositoryError);
  });
  expect(mockGitHubRepoRepository.findByUserId).toHaveBeenCalledWith(userId);
});

// エッジケースのテスト
test("非常に多くのリポジトリを持つユーザーの場合も正しく処理されること", async () => {
  // Arrange
  const userId = "user-with-many-repos";
  const manyRepos = Array.from({ length: 100 }, (_, i) => ({
    ...mockGitHubRepos[0],
    id: `repo-${i}`,
    name: `repo-${i}`,
    fullName: `octocat/repo-${i}`,
  }));

  (
    mockGitHubRepoRepository.findByUserId as ReturnType<typeof vi.fn>
  ).mockResolvedValue(ok(manyRepos));
  const useCase = new GetGitHubReposByUserUseCase(mockGitHubRepoRepository);

  // Act
  const result = await useCase.execute(userId);

  // Assert
  expect(result.isOk()).toBe(true);
  result.map((data) => {
    expect(data.length).toBe(100);
  });
});

// 境界条件のテスト
test("空のユーザーIDを指定した場合も正しく処理されること", async () => {
  // Arrange
  const emptyUserId = "";
  (
    mockGitHubRepoRepository.findByUserId as ReturnType<typeof vi.fn>
  ).mockResolvedValue(ok([]));
  const useCase = new GetGitHubReposByUserUseCase(mockGitHubRepoRepository);

  // Act
  const result = await useCase.execute(emptyUserId);

  // Assert
  expect(result.isOk()).toBe(true);
  expect(mockGitHubRepoRepository.findByUserId).toHaveBeenCalledWith(
    emptyUserId,
  );
});

// 無効な入力のテスト
test("無効なフォーマットのユーザーIDを指定した場合も正しく処理されること", async () => {
  // Arrange
  const invalidUserId = "invalid-user-id-format";
  (
    mockGitHubRepoRepository.findByUserId as ReturnType<typeof vi.fn>
  ).mockResolvedValue(ok([]));
  const useCase = new GetGitHubReposByUserUseCase(mockGitHubRepoRepository);

  // Act
  const result = await useCase.execute(invalidUserId);

  // Assert
  expect(result.isOk()).toBe(true);
  expect(mockGitHubRepoRepository.findByUserId).toHaveBeenCalledWith(
    invalidUserId,
  );
});

// セキュリティ関連のテスト
test("異なるユーザーのリポジトリを取得しようとした場合の検証", async () => {
  // Arrange
  const requestedUserId = "user-456"; // リクエストされたユーザーID
  const currentUserId = "user-123"; // 現在のユーザーID

  // 異なるユーザーのリポジトリを返すようにモックを設定
  const otherUserRepos = mockGitHubRepos.map((repo) => ({
    ...repo,
    userId: requestedUserId,
  }));

  (
    mockGitHubRepoRepository.findByUserId as ReturnType<typeof vi.fn>
  ).mockResolvedValue(ok(otherUserRepos));
  const useCase = new GetGitHubReposByUserUseCase(mockGitHubRepoRepository);

  // Act
  const result = await useCase.execute(requestedUserId);

  // Assert
  expect(result.isOk()).toBe(true);
  const repos = result._unsafeUnwrap();

  // リポジトリは取得できるが、ユーザーIDが現在のユーザーと異なることを確認
  expect(repos.length).toBeGreaterThan(0);
  for (const repo of repos) {
    expect(repo.userId).toBe(requestedUserId);
    expect(repo.userId).not.toBe(currentUserId);
  }

  // 実際のアプリケーションでは、ここでユーザーIDの検証を行い、
  // 権限がない場合はアクセスを拒否する必要があります
});
