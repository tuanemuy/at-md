import { err, ok } from "neverthrow";
import { expect, test, vi, beforeEach } from "vitest";
import type { User } from "../../models/user";
import { createAuthError } from "../../models/errors";
import type { AuthService } from "../../services/auth";
import { AuthenticateWithBlueskyUseCase } from "../authenticateWithBluesky";

// モックの認証サービスを作成
const mockAuthService: AuthService = {
  authenticateWithBluesky: vi.fn(),
  connectGitHub: vi.fn(),
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

test("有効なDIDとJWTを指定すると認証されたユーザーが返されること", async () => {
  // Arrange
  const did = "did:example:123";
  const jwt = "valid.jwt.token";
  (
    mockAuthService.authenticateWithBluesky as ReturnType<typeof vi.fn>
  ).mockResolvedValue(ok(mockUser));
  const useCase = new AuthenticateWithBlueskyUseCase(mockAuthService);

  // Act
  const result = await useCase.execute(did, jwt);

  // Assert
  expect(result.isOk()).toBe(true);
  result.map((data) => {
    expect(data).toEqual(mockUser);
  });
  expect(mockAuthService.authenticateWithBluesky).toHaveBeenCalledWith(
    did,
    jwt,
  );
});

test("無効なDIDとJWTを指定するとエラーが返されること", async () => {
  // Arrange
  const did = "did:example:invalid";
  const jwt = "invalid.jwt.token";
  const authError = createAuthError(
    "INVALID_CREDENTIALS",
    "認証情報が無効です",
  );
  (
    mockAuthService.authenticateWithBluesky as ReturnType<typeof vi.fn>
  ).mockResolvedValue(err(authError));
  const useCase = new AuthenticateWithBlueskyUseCase(mockAuthService);

  // Act
  const result = await useCase.execute(did, jwt);

  // Assert
  expect(result.isErr()).toBe(true);
  result.mapErr((error) => {
    expect(error).toEqual(authError);
  });
  expect(mockAuthService.authenticateWithBluesky).toHaveBeenCalledWith(
    did,
    jwt,
  );
});

test("認証サービスでエラーが発生した場合はエラーが返されること", async () => {
  // Arrange
  const did = "did:example:123";
  const jwt = "valid.jwt.token";
  const authError = createAuthError(
    "CONNECTION_FAILED",
    "認証サービスに接続できませんでした",
    new Error("接続エラー"),
  );
  (
    mockAuthService.authenticateWithBluesky as ReturnType<typeof vi.fn>
  ).mockResolvedValue(err(authError));
  const useCase = new AuthenticateWithBlueskyUseCase(mockAuthService);

  // Act
  const result = await useCase.execute(did, jwt);

  // Assert
  expect(result.isErr()).toBe(true);
  result.mapErr((error) => {
    expect(error).toEqual(authError);
    expect(error.cause).toBeDefined();
  });
  expect(mockAuthService.authenticateWithBluesky).toHaveBeenCalledWith(
    did,
    jwt,
  );
});

// エッジケースのテスト
test("非常に長いDIDとJWTを指定しても正しく処理されること", async () => {
  // Arrange
  const longDid = `did:example:${"a".repeat(1000)}`;
  const longJwt = `${"a".repeat(1000)}.${"b".repeat(1000)}.${"c".repeat(1000)}`;
  (
    mockAuthService.authenticateWithBluesky as ReturnType<typeof vi.fn>
  ).mockResolvedValue(ok(mockUser));
  const useCase = new AuthenticateWithBlueskyUseCase(mockAuthService);

  // Act
  const result = await useCase.execute(longDid, longJwt);

  // Assert
  expect(result.isOk()).toBe(true);
  expect(mockAuthService.authenticateWithBluesky).toHaveBeenCalledWith(
    longDid,
    longJwt,
  );
});

// 境界条件のテスト
test("空のDIDとJWTを指定した場合はエラーが返されること", async () => {
  // Arrange
  const emptyDid = "";
  const emptyJwt = "";
  const authError = createAuthError(
    "INVALID_CREDENTIALS",
    "DIDとJWTは必須です",
  );
  (
    mockAuthService.authenticateWithBluesky as ReturnType<typeof vi.fn>
  ).mockResolvedValue(err(authError));
  const useCase = new AuthenticateWithBlueskyUseCase(mockAuthService);

  // Act
  const result = await useCase.execute(emptyDid, emptyJwt);

  // Assert
  expect(result.isErr()).toBe(true);
  result.mapErr((error) => {
    expect(error.type).toBe("INVALID_CREDENTIALS");
  });
  expect(mockAuthService.authenticateWithBluesky).toHaveBeenCalledWith(
    emptyDid,
    emptyJwt,
  );
});
