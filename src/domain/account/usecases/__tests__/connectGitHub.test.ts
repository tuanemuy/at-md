import { err, ok } from "neverthrow";
import { expect, test, vi, beforeEach } from "vitest";
import type { GitHubConnection } from "../../models/user";
import { createAuthError } from "../../models/errors";
import type { AuthService } from "../../services/auth";
import { ConnectGitHubUseCase } from "../connectGitHub";

// モックの認証サービスを作成
const mockAuthService: AuthService = {
  authenticateWithBluesky: vi.fn(),
  connectGitHub: vi.fn()
};

// テスト用のGitHub連携情報データ
const mockGitHubConnection: GitHubConnection = {
  id: "conn-123",
  userId: "user-123",
  installationId: "12345",
  accessToken: "github_token_123",
  createdAt: new Date(),
  updatedAt: new Date()
};

// テスト前にモックをリセット
beforeEach(() => {
  vi.resetAllMocks();
});

test("有効なユーザーIDとインストールIDを指定するとGitHub連携情報が返されること", async () => {
  // Arrange
  const userId = "user-123";
  const installationId = 12345;
  (mockAuthService.connectGitHub as ReturnType<typeof vi.fn>).mockResolvedValue(ok(mockGitHubConnection));
  const useCase = new ConnectGitHubUseCase(mockAuthService);

  // Act
  const result = await useCase.execute(userId, installationId);

  // Assert
  expect(result.isOk()).toBe(true);
  result.map((data) => {
    expect(data).toEqual(mockGitHubConnection);
  });
  expect(mockAuthService.connectGitHub).toHaveBeenCalledWith(userId, installationId);
});

test("無効なユーザーIDやインストールIDを指定するとエラーが返されること", async () => {
  // Arrange
  const userId = "invalid-user";
  const installationId = -1;
  const authError = createAuthError(
    "INVALID_CREDENTIALS",
    "ユーザーIDまたはインストールIDが無効です",
  );
  (mockAuthService.connectGitHub as ReturnType<typeof vi.fn>).mockResolvedValue(err(authError));
  const useCase = new ConnectGitHubUseCase(mockAuthService);

  // Act
  const result = await useCase.execute(userId, installationId);

  // Assert
  expect(result.isErr()).toBe(true);
  result.mapErr((error) => {
    expect(error).toEqual(authError);
  });
  expect(mockAuthService.connectGitHub).toHaveBeenCalledWith(userId, installationId);
});

test("認証サービスでエラーが発生した場合はエラーが返されること", async () => {
  // Arrange
  const userId = "user-123";
  const installationId = 12345;
  const authError = createAuthError(
    "CONNECTION_FAILED",
    "GitHubとの連携に失敗しました",
    new Error("接続エラー")
  );
  (mockAuthService.connectGitHub as ReturnType<typeof vi.fn>).mockResolvedValue(err(authError));
  const useCase = new ConnectGitHubUseCase(mockAuthService);

  // Act
  const result = await useCase.execute(userId, installationId);

  // Assert
  expect(result.isErr()).toBe(true);
  result.mapErr((error) => {
    expect(error).toEqual(authError);
    expect(error.cause).toBeDefined();
  });
  expect(mockAuthService.connectGitHub).toHaveBeenCalledWith(userId, installationId);
});

// エッジケースのテスト
test("非常に大きなインストールIDを指定しても正しく処理されること", async () => {
  // Arrange
  const userId = "user-123";
  const largeInstallationId = Number.MAX_SAFE_INTEGER;
  (mockAuthService.connectGitHub as ReturnType<typeof vi.fn>).mockResolvedValue(ok(mockGitHubConnection));
  const useCase = new ConnectGitHubUseCase(mockAuthService);

  // Act
  const result = await useCase.execute(userId, largeInstallationId);

  // Assert
  expect(result.isOk()).toBe(true);
  expect(mockAuthService.connectGitHub).toHaveBeenCalledWith(userId, largeInstallationId);
});

// 境界条件のテスト
test("インストールIDが0の場合も正しく処理されること", async () => {
  // Arrange
  const userId = "user-123";
  const zeroInstallationId = 0;
  (mockAuthService.connectGitHub as ReturnType<typeof vi.fn>).mockResolvedValue(ok(mockGitHubConnection));
  const useCase = new ConnectGitHubUseCase(mockAuthService);

  // Act
  const result = await useCase.execute(userId, zeroInstallationId);

  // Assert
  expect(result.isOk()).toBe(true);
  expect(mockAuthService.connectGitHub).toHaveBeenCalledWith(userId, zeroInstallationId);
});

// 無効な入力のテスト
test("空のユーザーIDを指定した場合はエラーが返されること", async () => {
  // Arrange
  const emptyUserId = "";
  const installationId = 12345;
  const authError = createAuthError(
    "INVALID_CREDENTIALS",
    "ユーザーIDは必須です",
  );
  (mockAuthService.connectGitHub as ReturnType<typeof vi.fn>).mockResolvedValue(err(authError));
  const useCase = new ConnectGitHubUseCase(mockAuthService);

  // Act
  const result = await useCase.execute(emptyUserId, installationId);

  // Assert
  expect(result.isErr()).toBe(true);
  result.mapErr((error) => {
    expect(error.type).toBe("INVALID_CREDENTIALS");
  });
  expect(mockAuthService.connectGitHub).toHaveBeenCalledWith(emptyUserId, installationId);
}); 