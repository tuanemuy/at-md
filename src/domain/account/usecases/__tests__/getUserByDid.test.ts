import { createRepositoryError } from "@/domain/shared/models/common";
import { err, ok } from "neverthrow";
import { expect, test, vi, beforeEach } from "vitest";
import type { User } from "../../models/user";
import type { UserRepository } from "../../repositories/user";
import { GetUserByDidUseCase } from "../getUserByDid";

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

test("存在するDIDを指定するとユーザーが返されること", async () => {
  // Arrange
  (mockUserRepository.findByDid as ReturnType<typeof vi.fn>).mockResolvedValue(ok(mockUser));
  const useCase = new GetUserByDidUseCase(mockUserRepository);

  // Act
  const result = await useCase.execute(mockUser.did);

  // Assert
  expect(result.isOk()).toBe(true);
  result.map((data) => {
    expect(data).toEqual(mockUser);
  });
  expect(mockUserRepository.findByDid).toHaveBeenCalledWith(mockUser.did);
});

test("存在しないDIDを指定するとnullが返されること", async () => {
  // Arrange
  const did = "did:example:nonexistent";
  (mockUserRepository.findByDid as ReturnType<typeof vi.fn>).mockResolvedValue(ok(null));
  const useCase = new GetUserByDidUseCase(mockUserRepository);

  // Act
  const result = await useCase.execute(did);

  // Assert
  expect(result.isOk()).toBe(true);
  result.map((data) => {
    expect(data).toBeNull();
  });
  expect(mockUserRepository.findByDid).toHaveBeenCalledWith(did);
});

test("リポジトリでエラーが発生した場合はエラーが返されること", async () => {
  // Arrange
  const did = "did:example:123";
  const repositoryError = createRepositoryError(
    "DATABASE_ERROR",
    "データベースエラーが発生しました",
  );
  (mockUserRepository.findByDid as ReturnType<typeof vi.fn>).mockResolvedValue(err(repositoryError));
  const useCase = new GetUserByDidUseCase(mockUserRepository);

  // Act
  const result = await useCase.execute(did);

  // Assert
  expect(result.isErr()).toBe(true);
  result.mapErr((error) => {
    expect(error).toEqual(repositoryError);
  });
  expect(mockUserRepository.findByDid).toHaveBeenCalledWith(did);
});

// エッジケースのテスト
test("非常に長いDIDを指定しても正しく処理されること", async () => {
  // Arrange
  const longDid = `did:example:${"a".repeat(1000)}`; // 非常に長いDID
  (mockUserRepository.findByDid as ReturnType<typeof vi.fn>).mockResolvedValue(ok(null));
  const useCase = new GetUserByDidUseCase(mockUserRepository);

  // Act
  const result = await useCase.execute(longDid);

  // Assert
  expect(result.isOk()).toBe(true);
  expect(mockUserRepository.findByDid).toHaveBeenCalledWith(longDid);
});

// 境界条件のテスト
test("空のDIDを指定した場合も正しく処理されること", async () => {
  // Arrange
  const emptyDid = "";
  (mockUserRepository.findByDid as ReturnType<typeof vi.fn>).mockResolvedValue(ok(null));
  const useCase = new GetUserByDidUseCase(mockUserRepository);

  // Act
  const result = await useCase.execute(emptyDid);

  // Assert
  expect(result.isOk()).toBe(true);
  expect(mockUserRepository.findByDid).toHaveBeenCalledWith(emptyDid);
});

// 無効な入力のテスト
test("無効なフォーマットのDIDを指定した場合も正しく処理されること", async () => {
  // Arrange
  const invalidDid = "invalid-did-format";
  (mockUserRepository.findByDid as ReturnType<typeof vi.fn>).mockResolvedValue(ok(null));
  const useCase = new GetUserByDidUseCase(mockUserRepository);

  // Act
  const result = await useCase.execute(invalidDid);

  // Assert
  expect(result.isOk()).toBe(true);
  expect(mockUserRepository.findByDid).toHaveBeenCalledWith(invalidDid);
}); 