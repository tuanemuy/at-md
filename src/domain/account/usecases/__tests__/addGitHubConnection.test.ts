import { createRepositoryError } from "@/domain/shared/models/common";
import { err, ok } from "neverthrow";
import { expect, test, vi, beforeEach } from "vitest";
import type { GitHubConnection } from "../../models/user";
import type { UserRepository } from "../../repositories/user";
import { AddGitHubConnectionUseCase } from "../addGitHubConnection";

// モックのユーザーリポジトリを作成
const mockUserRepository: UserRepository = {
  findById: vi.fn(),
  findByDid: vi.fn(),
  save: vi.fn(),
  addGitHubConnection: vi.fn(),
};

// テスト用のGitHub連携情報データ
const mockGitHubConnection: GitHubConnection = {
  id: "conn-123",
  userId: "user-123",
  installationId: "12345",
  accessToken: "github_token_123",
  createdAt: new Date(),
  updatedAt: new Date(),
};

// テスト前にモックをリセット
beforeEach(() => {
  vi.resetAllMocks();
});

test("有効なユーザーIDとGitHub連携情報を指定すると保存されて返されること", async () => {
  // Arrange
  (
    mockUserRepository.addGitHubConnection as ReturnType<typeof vi.fn>
  ).mockResolvedValue(
    ok({
      ...mockGitHubConnection,
      updatedAt: new Date(), // 更新日時が変わることを想定
    }),
  );
  const useCase = new AddGitHubConnectionUseCase(mockUserRepository);

  // Act
  const result = await useCase.execute(
    mockGitHubConnection.userId,
    mockGitHubConnection,
  );

  // Assert
  expect(result.isOk()).toBe(true);
  result.map((data) => {
    expect(data.id).toEqual(mockGitHubConnection.id);
    expect(data.userId).toEqual(mockGitHubConnection.userId);
    expect(data.installationId).toEqual(mockGitHubConnection.installationId);
    expect(data.accessToken).toEqual(mockGitHubConnection.accessToken);
  });
  expect(mockUserRepository.addGitHubConnection).toHaveBeenCalledWith(
    mockGitHubConnection.userId,
    mockGitHubConnection,
  );
});

test("リポジトリでエラーが発生した場合はエラーが返されること", async () => {
  // Arrange
  const repositoryError = createRepositoryError(
    "DATABASE_ERROR",
    "データベースエラーが発生しました",
  );
  (
    mockUserRepository.addGitHubConnection as ReturnType<typeof vi.fn>
  ).mockResolvedValue(err(repositoryError));
  const useCase = new AddGitHubConnectionUseCase(mockUserRepository);

  // Act
  const result = await useCase.execute(
    mockGitHubConnection.userId,
    mockGitHubConnection,
  );

  // Assert
  expect(result.isErr()).toBe(true);
  result.mapErr((error) => {
    expect(error).toEqual(repositoryError);
  });
  expect(mockUserRepository.addGitHubConnection).toHaveBeenCalledWith(
    mockGitHubConnection.userId,
    mockGitHubConnection,
  );
});

// エッジケースのテスト
test("IDがないGitHub連携情報を保存すると新しいIDが割り当てられること", async () => {
  // Arrange
  const connectionWithoutId = {
    ...mockGitHubConnection,
    id: "" as string, // 空のID
  };

  const savedConnection = {
    ...mockGitHubConnection,
    id: "new-conn-id", // 新しいID
    updatedAt: new Date(),
  };

  (
    mockUserRepository.addGitHubConnection as ReturnType<typeof vi.fn>
  ).mockResolvedValue(ok(savedConnection));
  const useCase = new AddGitHubConnectionUseCase(mockUserRepository);

  // Act
  const result = await useCase.execute(
    mockGitHubConnection.userId,
    connectionWithoutId,
  );

  // Assert
  expect(result.isOk()).toBe(true);
  result.map((data) => {
    expect(data.id).toBe("new-conn-id");
    expect(data.id).not.toBe("");
  });
});

test("アクセストークンがnullのGitHub連携情報を保存できること", async () => {
  // Arrange
  const connectionWithNullToken = {
    ...mockGitHubConnection,
    accessToken: null,
  };

  (
    mockUserRepository.addGitHubConnection as ReturnType<typeof vi.fn>
  ).mockResolvedValue(ok(connectionWithNullToken));
  const useCase = new AddGitHubConnectionUseCase(mockUserRepository);

  // Act
  const result = await useCase.execute(
    mockGitHubConnection.userId,
    connectionWithNullToken,
  );

  // Assert
  expect(result.isOk()).toBe(true);
  result.map((data) => {
    expect(data.accessToken).toBeNull();
  });
});

// 境界条件のテスト
test("更新日時が過去のGitHub連携情報を保存すると現在の日時に更新されること", async () => {
  // Arrange
  const pastDate = new Date();
  pastDate.setFullYear(pastDate.getFullYear() - 1); // 1年前

  const connectionWithPastDate = {
    ...mockGitHubConnection,
    updatedAt: pastDate,
  };

  const now = new Date();
  const savedConnection = {
    ...connectionWithPastDate,
    updatedAt: now, // 現在の日時
  };

  (
    mockUserRepository.addGitHubConnection as ReturnType<typeof vi.fn>
  ).mockResolvedValue(ok(savedConnection));
  const useCase = new AddGitHubConnectionUseCase(mockUserRepository);

  // Act
  const result = await useCase.execute(
    mockGitHubConnection.userId,
    connectionWithPastDate,
  );

  // Assert
  expect(result.isOk()).toBe(true);
  result.map((data) => {
    expect(data.updatedAt).toEqual(now);
    expect(data.updatedAt).not.toEqual(pastDate);
  });
});

// 無効な入力のテスト
test("必須フィールドが欠けているGitHub連携情報を保存するとエラーになること", async () => {
  // Arrange
  const invalidConnection = {
    ...mockGitHubConnection,
    installationId: "", // 空のインストールID
  };

  const validationError = createRepositoryError(
    "VALIDATION_ERROR",
    "インストールIDは必須です",
  );

  (
    mockUserRepository.addGitHubConnection as ReturnType<typeof vi.fn>
  ).mockResolvedValue(err(validationError));
  const useCase = new AddGitHubConnectionUseCase(mockUserRepository);

  // Act
  const result = await useCase.execute(
    mockGitHubConnection.userId,
    invalidConnection,
  );

  // Assert
  expect(result.isErr()).toBe(true);
  result.mapErr((error) => {
    expect(error.type).toBe("VALIDATION_ERROR");
  });
});
