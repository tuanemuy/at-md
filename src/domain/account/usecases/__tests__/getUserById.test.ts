import { createRepositoryError } from "@/domain/shared/models/common";
import { err, ok } from "neverthrow";
import { expect, test, vi, beforeEach } from "vitest";
import type { User } from "../../models/user";
import type { UserRepository } from "../../repositories/user";
import { GetUserByIdUseCase } from "../getUserById";

// モックのユーザーリポジトリを作成
const mockUserRepository: UserRepository = {
  findById: vi.fn(),
  findByDid: vi.fn(),
  save: vi.fn(),
  addGitHubConnection: vi.fn()
};

// テスト用のユーザーデータ
const mockUser: User = {
  id: "user-123",
  name: "テストユーザー",
  did: "did:example:123",
  createdAt: new Date(),
  updatedAt: new Date(),
  gitHubConnections: []
};

// テスト前にモックをリセット
beforeEach(() => {
  vi.resetAllMocks();
});

test("存在するユーザーIDを指定するとユーザーが返されること", async () => {
  // Arrange
  (mockUserRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(ok(mockUser));
  const useCase = new GetUserByIdUseCase(mockUserRepository);

  // Act
  const result = await useCase.execute(mockUser.id);

  // Assert
  expect(result.isOk()).toBe(true);
  result.map((data) => {
    expect(data).toEqual(mockUser);
  });
  expect(mockUserRepository.findById).toHaveBeenCalledWith(mockUser.id);
});

test("存在しないユーザーIDを指定するとnullが返されること", async () => {
  // Arrange
  const userId = "non-existent-id";
  (mockUserRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(ok(null));
  const useCase = new GetUserByIdUseCase(mockUserRepository);

  // Act
  const result = await useCase.execute(userId);

  // Assert
  expect(result.isOk()).toBe(true);
  result.map((data) => {
    expect(data).toBeNull();
  });
  expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
});

test("リポジトリでエラーが発生した場合はエラーが返されること", async () => {
  // Arrange
  const userId = "user-123";
  const repositoryError = createRepositoryError(
    "DATABASE_ERROR",
    "データベースエラーが発生しました",
  );
  (mockUserRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(err(repositoryError));
  const useCase = new GetUserByIdUseCase(mockUserRepository);

  // Act
  const result = await useCase.execute(userId);

  // Assert
  expect(result.isErr()).toBe(true);
  result.mapErr((error) => {
    expect(error).toEqual(repositoryError);
  });
  expect(mockUserRepository.findById).toHaveBeenCalledWith(userId);
});

// エッジケースのテスト
test("非常に長いIDを指定しても正しく処理されること", async () => {
  // Arrange
  const longId = "a".repeat(1000); // 非常に長いID
  (mockUserRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(ok(null));
  const useCase = new GetUserByIdUseCase(mockUserRepository);

  // Act
  const result = await useCase.execute(longId);

  // Assert
  expect(result.isOk()).toBe(true);
  expect(mockUserRepository.findById).toHaveBeenCalledWith(longId);
});

// 境界条件のテスト
test("空のIDを指定した場合も正しく処理されること", async () => {
  // Arrange
  const emptyId = "";
  (mockUserRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(ok(null));
  const useCase = new GetUserByIdUseCase(mockUserRepository);

  // Act
  const result = await useCase.execute(emptyId);

  // Assert
  expect(result.isOk()).toBe(true);
  expect(mockUserRepository.findById).toHaveBeenCalledWith(emptyId);
});

// 無効な入力のテスト
test("無効なフォーマットのIDを指定した場合も正しく処理されること", async () => {
  // Arrange
  const invalidId = "invalid-id-format";
  (mockUserRepository.findById as ReturnType<typeof vi.fn>).mockResolvedValue(ok(null));
  const useCase = new GetUserByIdUseCase(mockUserRepository);

  // Act
  const result = await useCase.execute(invalidId);

  // Assert
  expect(result.isOk()).toBe(true);
  expect(mockUserRepository.findById).toHaveBeenCalledWith(invalidId);
}); 