import { createRepositoryError } from "@/domain/shared/models/common";
import { err, ok } from "neverthrow";
import { expect, test, vi, beforeEach } from "vitest";
import type { User } from "../../models/user";
import type { UserRepository } from "../../repositories/user";
import { SaveUserUseCase } from "../saveUser";

// モックのユーザーリポジトリを作成
const mockUserRepository: UserRepository = {
  findById: vi.fn(),
  findByDid: vi.fn(),
  save: vi.fn(),
  addGitHubConnection: vi.fn(),
};

// テスト用のユーザーデータ
const mockUser: User = {
  id: "user-123",
  name: "テストユーザー",
  did: "did:example:123",
  createdAt: new Date(),
  updatedAt: new Date(),
  gitHubConnections: [],
};

// テスト前にモックをリセット
beforeEach(() => {
  vi.resetAllMocks();
});

test("有効なユーザーを指定すると保存されて返されること", async () => {
  // Arrange
  (mockUserRepository.save as ReturnType<typeof vi.fn>).mockResolvedValue(
    ok({
      ...mockUser,
      updatedAt: new Date(), // 更新日時が変わることを想定
    }),
  );
  const useCase = new SaveUserUseCase(mockUserRepository);

  // Act
  const result = await useCase.execute(mockUser);

  // Assert
  expect(result.isOk()).toBe(true);
  result.map((data) => {
    expect(data.id).toEqual(mockUser.id);
    expect(data.name).toEqual(mockUser.name);
    expect(data.did).toEqual(mockUser.did);
  });
  expect(mockUserRepository.save).toHaveBeenCalledWith(mockUser);
});

test("リポジトリでエラーが発生した場合はエラーが返されること", async () => {
  // Arrange
  const repositoryError = createRepositoryError(
    "DATABASE_ERROR",
    "データベースエラーが発生しました",
  );
  (mockUserRepository.save as ReturnType<typeof vi.fn>).mockResolvedValue(
    err(repositoryError),
  );
  const useCase = new SaveUserUseCase(mockUserRepository);

  // Act
  const result = await useCase.execute(mockUser);

  // Assert
  expect(result.isErr()).toBe(true);
  result.mapErr((error) => {
    expect(error).toEqual(repositoryError);
  });
  expect(mockUserRepository.save).toHaveBeenCalledWith(mockUser);
});

// エッジケースのテスト
test("IDがないユーザーを保存すると新しいIDが割り当てられること", async () => {
  // Arrange
  const userWithoutId = {
    ...mockUser,
    id: "" as string, // 空のID
  };

  const savedUser = {
    ...mockUser,
    id: "new-user-id", // 新しいID
    updatedAt: new Date(),
  };

  (mockUserRepository.save as ReturnType<typeof vi.fn>).mockResolvedValue(
    ok(savedUser),
  );
  const useCase = new SaveUserUseCase(mockUserRepository);

  // Act
  const result = await useCase.execute(userWithoutId);

  // Assert
  expect(result.isOk()).toBe(true);
  result.map((data) => {
    expect(data.id).toBe("new-user-id");
    expect(data.id).not.toBe("");
  });
});

test("非常に長い名前を持つユーザーを保存できること", async () => {
  // Arrange
  const longNameUser = {
    ...mockUser,
    name: "A".repeat(1000), // 非常に長い名前
  };

  (mockUserRepository.save as ReturnType<typeof vi.fn>).mockResolvedValue(
    ok(longNameUser),
  );
  const useCase = new SaveUserUseCase(mockUserRepository);

  // Act
  const result = await useCase.execute(longNameUser);

  // Assert
  expect(result.isOk()).toBe(true);
  result.map((data) => {
    expect(data.name.length).toBe(1000);
  });
});

// 境界条件のテスト
test("更新日時が過去のユーザーを保存すると現在の日時に更新されること", async () => {
  // Arrange
  const pastDate = new Date();
  pastDate.setFullYear(pastDate.getFullYear() - 1); // 1年前

  const userWithPastDate = {
    ...mockUser,
    updatedAt: pastDate,
  };

  const now = new Date();
  const savedUser = {
    ...userWithPastDate,
    updatedAt: now, // 現在の日時
  };

  (mockUserRepository.save as ReturnType<typeof vi.fn>).mockResolvedValue(
    ok(savedUser),
  );
  const useCase = new SaveUserUseCase(mockUserRepository);

  // Act
  const result = await useCase.execute(userWithPastDate);

  // Assert
  expect(result.isOk()).toBe(true);
  result.map((data) => {
    expect(data.updatedAt).toEqual(now);
    expect(data.updatedAt).not.toEqual(pastDate);
  });
});

// 無効な入力のテスト
test("必須フィールドが欠けているユーザーを保存するとエラーになること", async () => {
  // Arrange
  const invalidUser = {
    ...mockUser,
    name: "", // 空の名前
    did: "", // 空のDID
  };

  const validationError = createRepositoryError(
    "VALIDATION_ERROR",
    "名前とDIDは必須です",
  );

  (mockUserRepository.save as ReturnType<typeof vi.fn>).mockResolvedValue(
    err(validationError),
  );
  const useCase = new SaveUserUseCase(mockUserRepository);

  // Act
  const result = await useCase.execute(invalidUser);

  // Assert
  expect(result.isErr()).toBe(true);
  result.mapErr((error) => {
    expect(error.type).toBe("VALIDATION_ERROR");
  });
});
