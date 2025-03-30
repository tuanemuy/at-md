import { expect, test, vi, beforeEach } from "vitest";
import { ConnectGitHubService } from "../connect-github";
import { okAsync, errAsync } from "@/lib/result";
import {
  ApplicationServiceError,
  ApplicationServiceErrorCode,
} from "@/domain/types/error";
import {
  ExternalServiceError,
  ExternalServiceErrorCode,
} from "@/domain/types/error";
import { RepositoryError, RepositoryErrorCode } from "@/domain/types/error";
import type { GitHubConnection } from "@/domain/account/models/github-connection";


const mockGitHubAppProvider = {
  getAccessToken: vi.fn(),
  getInstallations: vi.fn(),
};

const mockGitHubConnectionRepository = {
  create: vi.fn(),
  update: vi.fn(),
  findByUserId: vi.fn(),
  findById: vi.fn(),
  deleteByUserId: vi.fn(),
  delete: vi.fn(),
};


beforeEach(() => {
  vi.resetAllMocks();
});

test("正常にGitHub連携が作成された場合にvoidが返されること", async () => {
  
  const userId = "test-user-id";
  const code = "github-auth-code";
  const accessToken = "github-access-token";
  const refreshToken = "github-refresh-token";

  const githubConnection: GitHubConnection = {
    id: "github-connection-id",
    userId,
    accessToken,
    refreshToken,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  mockGitHubAppProvider.getAccessToken.mockReturnValue(
    okAsync({
      accessToken,
      refreshToken,
    }),
  );

  mockGitHubConnectionRepository.create.mockReturnValue(
    okAsync(githubConnection),
  );

  const service = new ConnectGitHubService({
    deps: {
      githubAppProvider: mockGitHubAppProvider,
      githubConnectionRepository: mockGitHubConnectionRepository,
    },
  });

  
  const result = await service.execute({ userId, code });

  
  expect(mockGitHubAppProvider.getAccessToken).toHaveBeenCalledWith(code);
  expect(mockGitHubConnectionRepository.create).toHaveBeenCalledWith({
    userId,
    accessToken,
    refreshToken: refreshToken,
  });
  expect(result.isOk()).toBe(true);
});

test("アクセストークンの取得に失敗した場合にエラーが返されること", async () => {
  
  const userId = "test-user-id";
  const code = "invalid-github-auth-code";

  const providerError = new ExternalServiceError(
    "GitHub",
    ExternalServiceErrorCode.AUTHENTICATION_FAILED,
    "アクセストークンの取得に失敗",
  );

  mockGitHubAppProvider.getAccessToken.mockReturnValue(errAsync(providerError));

  const service = new ConnectGitHubService({
    deps: {
      githubAppProvider: mockGitHubAppProvider,
      githubConnectionRepository: mockGitHubConnectionRepository,
    },
  });

  
  const result = await service.execute({ userId, code });

  
  expect(mockGitHubAppProvider.getAccessToken).toHaveBeenCalledWith(code);
  expect(mockGitHubConnectionRepository.create).not.toHaveBeenCalled();
  expect(result.isErr()).toBe(true);
  if (result.isErr()) {
    expect(result.error).toBeInstanceOf(ApplicationServiceError);
    expect(result.error.code).toBe(
      ApplicationServiceErrorCode.ACCOUNT_CONTEXT_ERROR,
    );
    expect(result.error.cause).toBe(providerError);
  }
});

test("GitHub連携の作成に失敗した場合にエラーが返されること", async () => {
  
  const userId = "test-user-id";
  const code = "github-auth-code";
  const accessToken = "github-access-token";
  const refreshToken = "github-refresh-token";

  const repoError = new RepositoryError(
    RepositoryErrorCode.CONSTRAINT_VIOLATION,
    "既に連携が存在します",
  );

  mockGitHubAppProvider.getAccessToken.mockReturnValue(
    okAsync({
      accessToken,
      refreshToken,
    }),
  );

  mockGitHubConnectionRepository.create.mockReturnValue(errAsync(repoError));

  const service = new ConnectGitHubService({
    deps: {
      githubAppProvider: mockGitHubAppProvider,
      githubConnectionRepository: mockGitHubConnectionRepository,
    },
  });

  
  const result = await service.execute({ userId, code });

  
  expect(mockGitHubAppProvider.getAccessToken).toHaveBeenCalledWith(code);
  expect(mockGitHubConnectionRepository.create).toHaveBeenCalledWith({
    userId,
    accessToken,
    refreshToken: refreshToken,
  });
  expect(result.isErr()).toBe(true);
  if (result.isErr()) {
    expect(result.error).toBeInstanceOf(ApplicationServiceError);
    expect(result.error.code).toBe(
      ApplicationServiceErrorCode.ACCOUNT_CONTEXT_ERROR,
    );
    expect(result.error.cause).toBe(repoError);
  }
});

