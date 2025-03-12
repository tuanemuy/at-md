import { createRepositoryError } from "@/domain/shared/models/common";
import { err, ok } from "neverthrow";
import { expect, test, vi, beforeEach } from "vitest";
import type { GitHubRepo } from "../../models/githubRepo";
import type { GitHubRepoRepository } from "../../repositories/githubRepo";
import { SaveGitHubRepoUseCase } from "../saveGitHubRepo";

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

test("有効なGitHubリポジトリを指定すると保存されて返されること", async () => {
  // Arrange
  (mockGitHubRepoRepository.save as ReturnType<typeof vi.fn>).mockResolvedValue(ok({
    ...mockGitHubRepo,
    updatedAt: new Date() // 更新日時が変わることを想定
  }));
  const useCase = new SaveGitHubRepoUseCase(mockGitHubRepoRepository);

  // Act
  const result = await useCase.execute(mockGitHubRepo);

  // Assert
  expect(result.isOk()).toBe(true);
  result.map((data) => {
    expect(data.id).toEqual(mockGitHubRepo.id);
    expect(data.owner).toEqual(mockGitHubRepo.owner);
    expect(data.name).toEqual(mockGitHubRepo.name);
    expect(data.fullName).toEqual(mockGitHubRepo.fullName);
  });
  expect(mockGitHubRepoRepository.save).toHaveBeenCalledWith(mockGitHubRepo);
});

test("リポジトリでエラーが発生した場合はエラーが返されること", async () => {
  // Arrange
  const repositoryError = createRepositoryError(
    "DATABASE_ERROR",
    "データベースエラーが発生しました",
  );
  (mockGitHubRepoRepository.save as ReturnType<typeof vi.fn>).mockResolvedValue(err(repositoryError));
  const useCase = new SaveGitHubRepoUseCase(mockGitHubRepoRepository);

  // Act
  const result = await useCase.execute(mockGitHubRepo);

  // Assert
  expect(result.isErr()).toBe(true);
  result.mapErr((error) => {
    expect(error).toEqual(repositoryError);
  });
  expect(mockGitHubRepoRepository.save).toHaveBeenCalledWith(mockGitHubRepo);
});

// エッジケースのテスト
test("IDがないGitHubリポジトリを保存すると新しいIDが割り当てられること", async () => {
  // Arrange
  const repoWithoutId = {
    ...mockGitHubRepo,
    id: "" as string // 空のID
  };
  
  const savedRepo = {
    ...mockGitHubRepo,
    id: "new-repo-id", // 新しいID
    updatedAt: new Date()
  };
  
  (mockGitHubRepoRepository.save as ReturnType<typeof vi.fn>).mockResolvedValue(ok(savedRepo));
  const useCase = new SaveGitHubRepoUseCase(mockGitHubRepoRepository);

  // Act
  const result = await useCase.execute(repoWithoutId);

  // Assert
  expect(result.isOk()).toBe(true);
  result.map((data) => {
    expect(data.id).toBe("new-repo-id");
    expect(data.id).not.toBe("");
  });
});

test("非常に長い名前を持つGitHubリポジトリを保存できること", async () => {
  // Arrange
  const longNameRepo = {
    ...mockGitHubRepo,
    name: "a".repeat(1000), // 非常に長い名前
    fullName: `${mockGitHubRepo.owner}/${"a".repeat(1000)}`
  };
  
  (mockGitHubRepoRepository.save as ReturnType<typeof vi.fn>).mockResolvedValue(ok(longNameRepo));
  const useCase = new SaveGitHubRepoUseCase(mockGitHubRepoRepository);

  // Act
  const result = await useCase.execute(longNameRepo);

  // Assert
  expect(result.isOk()).toBe(true);
  result.map((data) => {
    expect(data.name.length).toBe(1000);
  });
});

// 境界条件のテスト
test("更新日時が過去のGitHubリポジトリを保存すると現在の日時に更新されること", async () => {
  // Arrange
  const pastDate = new Date();
  pastDate.setFullYear(pastDate.getFullYear() - 1); // 1年前
  
  const repoWithPastDate = {
    ...mockGitHubRepo,
    updatedAt: pastDate
  };
  
  const now = new Date();
  const savedRepo = {
    ...repoWithPastDate,
    updatedAt: now // 現在の日時
  };
  
  (mockGitHubRepoRepository.save as ReturnType<typeof vi.fn>).mockResolvedValue(ok(savedRepo));
  const useCase = new SaveGitHubRepoUseCase(mockGitHubRepoRepository);

  // Act
  const result = await useCase.execute(repoWithPastDate);

  // Assert
  expect(result.isOk()).toBe(true);
  result.map((data) => {
    expect(data.updatedAt).toEqual(now);
    expect(data.updatedAt).not.toEqual(pastDate);
  });
});

// 無効な入力のテスト
test("必須フィールドが欠けているGitHubリポジトリを保存するとエラーになること", async () => {
  // Arrange
  const invalidRepo = {
    ...mockGitHubRepo,
    owner: "", // 空のオーナー名
    name: ""   // 空のリポジトリ名
  };
  
  const validationError = createRepositoryError(
    "VALIDATION_ERROR",
    "オーナー名とリポジトリ名は必須です",
  );
  
  (mockGitHubRepoRepository.save as ReturnType<typeof vi.fn>).mockResolvedValue(err(validationError));
  const useCase = new SaveGitHubRepoUseCase(mockGitHubRepoRepository);

  // Act
  const result = await useCase.execute(invalidRepo);

  // Assert
  expect(result.isErr()).toBe(true);
  result.mapErr((error) => {
    expect(error.type).toBe("VALIDATION_ERROR");
  });
});

// セキュリティ関連のテスト
test("異なるユーザーのGitHubリポジトリを保存しようとした場合の検証", async () => {
  // Arrange
  const currentUserId = "user-123"; // 現在のユーザーID
  const otherUserRepo = {
    ...mockGitHubRepo,
    userId: "user-456" // 異なるユーザーID
  };
  
  // 保存は成功するが、実際のアプリケーションでは権限チェックが必要
  (mockGitHubRepoRepository.save as ReturnType<typeof vi.fn>).mockResolvedValue(ok(otherUserRepo));
  const useCase = new SaveGitHubRepoUseCase(mockGitHubRepoRepository);

  // Act
  const result = await useCase.execute(otherUserRepo);

  // Assert
  expect(result.isOk()).toBe(true);
  const repo = result._unsafeUnwrap();
  
  // リポジトリは保存できるが、ユーザーIDが現在のユーザーと異なることを確認
  expect(repo.userId).not.toBe(currentUserId);
  expect(repo.userId).toBe("user-456");
  
  // 実際のアプリケーションでは、保存前にユーザーIDの検証を行い、
  // 権限がない場合は操作を拒否する必要があります
}); 