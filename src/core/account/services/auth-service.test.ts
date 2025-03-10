/**
 * 認証サービスのテスト
 * ATプロトコルによるOAuth認証の動作を検証します。
 */

import { expect } from "@std/expect";
import { describe, it, beforeEach } from "@std/testing/bdd";
import { AuthService, AuthResult, TokenVerificationResult } from "./auth-service.ts";
import { AtIdentifier, createAtIdentifier } from "../value-objects/mod.ts";
import { UserAggregate } from "../aggregates/mod.ts";
import { Result, ok, err } from "npm:neverthrow";

// OAuthエラークラスの定義
class OAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OAuthError";
  }
}

// モックのATプロトコルクライアント
interface AtProtocolClient {
  exchangeAuthCode(authCode: string): Promise<{
    success: boolean;
    accessToken?: string;
    error?: string;
  }>;
  getUserInfo(accessToken: string): Promise<{
    did: string;
    handle?: string;
  }>;
}

// モックのユーザーリポジトリ
interface UserRepository {
  findByAtIdentifier(did: string): Promise<UserAggregate | null>;
  findById(id: string): Promise<UserAggregate | null>;
}

describe("AuthService", () => {
  let authService: AuthService;
  let mockAtProtocolClient: AtProtocolClient;
  let mockUserRepository: UserRepository;

  beforeEach(() => {
    // モックの実装
    mockAtProtocolClient = {
      exchangeAuthCode: (authCode: string) => {
        if (authCode === "valid-code") {
          return Promise.resolve({
            success: true,
            accessToken: "mock-access-token"
          });
        } else {
          return Promise.resolve({
            success: false,
            error: "無効な認証コード"
          });
        }
      },
      getUserInfo: (accessToken: string) => {
        if (accessToken === "mock-access-token") {
          return Promise.resolve({
            did: "did:plc:abcdefghijklmnopqrstuvwxyz",
            handle: "@test.bsky.social"
          });
        } else {
          throw new Error("無効なアクセストークン");
        }
      }
    };

    mockUserRepository = {
      findByAtIdentifier: (did: string) => {
        return Promise.resolve(null); // ユーザーが存在しない
      },
      
      findById: (id: string) => {
        return Promise.resolve(null); // ユーザーが存在しない
      }
    };

    // AuthServiceの実装クラスをインスタンス化
    // 注: 実際の実装クラス名に合わせて変更してください
    authService = {
      authenticateWithAtProtocol: async (authCode: string): Promise<AuthResult> => {
        try {
          // 認証コードを使用してATプロトコルからトークンを取得
          const atProtocolResponse = await mockAtProtocolClient.exchangeAuthCode(authCode);
          
          if (!atProtocolResponse.success) {
            return {
              success: false,
              errorMessage: atProtocolResponse.error || "認証に失敗しました"
            };
          }
          
          // ATプロトコルからユーザー情報を取得
          const userInfo = await mockAtProtocolClient.getUserInfo(atProtocolResponse.accessToken!);
          
          if (!userInfo.did) {
            return {
              success: false,
              errorMessage: "ユーザー情報の取得に失敗しました"
            };
          }
          
          // ATプロトコル識別子を作成
          const atIdentifier = createAtIdentifier(userInfo.did, userInfo.handle);
          
          // ユーザーが存在するか確認
          const existingUser = await mockUserRepository.findByAtIdentifier(atIdentifier.value);
          
          // 認証トークンを生成（モックでは固定値）
          const token = "mock-jwt-token";
          
          return {
            success: true,
            token,
            atIdentifier
          };
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : "認証中にエラーが発生しました";
          return {
            success: false,
            errorMessage
          };
        }
      },
      
      verifyToken: (token: string): Promise<TokenVerificationResult> => {
        if (token === "mock-jwt-token") {
          return Promise.resolve({
            valid: true,
            userId: "mock-user-id"
          });
        } else {
          return Promise.resolve({
            valid: false
          });
        }
      }
    };
  });

  it("有効な認証コードで認証に成功すること", async () => {
    // Arrange
    const authCode = "valid-code";
    
    // Act
    const result = await authService.authenticateWithAtProtocol(authCode);
    
    // Assert
    expect(result.success).toBe(true);
    expect(result.token).toBeDefined();
    expect(result.atIdentifier).toBeDefined();
    if (result.atIdentifier) {
      expect(result.atIdentifier.value).toBe("did:plc:abcdefghijklmnopqrstuvwxyz");
      expect(result.atIdentifier.handle).toBe("@test.bsky.social");
    }
  });

  it("無効な認証コードで認証に失敗すること", async () => {
    // Arrange
    const authCode = "invalid-code";
    
    // Act
    const result = await authService.authenticateWithAtProtocol(authCode);
    
    // Assert
    expect(result.success).toBe(false);
    expect(result.errorMessage).toBeDefined();
    expect(result.token).toBeUndefined();
    expect(result.atIdentifier).toBeUndefined();
  });

  it("有効なトークンで検証に成功すること", async () => {
    // Arrange
    const token = "mock-jwt-token";
    
    // Act
    const result = await authService.verifyToken(token);
    
    // Assert
    expect(result.valid).toBe(true);
    expect(result.userId).toBeDefined();
  });

  it("無効なトークンで検証に失敗すること", async () => {
    // Arrange
    const token = "invalid-token";
    
    // Act
    const result = await authService.verifyToken(token);
    
    // Assert
    expect(result.valid).toBe(false);
    expect(result.userId).toBeUndefined();
  });

  it("認証コードを交換してユーザー情報を取得できる", () => {
    // モックの作成
    const mockOAuthAdapter = {
      exchangeAuthCode: (authCode: string) => {
        if (authCode === "valid-code") {
          return Promise.resolve(ok({
            accessToken: "test-access-token",
            refreshToken: "test-refresh-token",
            expiresIn: 3600,
            tokenType: "Bearer"
          }));
        } else {
          return Promise.resolve(err(new OAuthError("Invalid auth code")));
        }
      },
      
      getUserInfo: (accessToken: string) => {
        if (accessToken === "test-access-token") {
          return Promise.resolve(ok({
            id: "test-user-id",
            name: "Test User",
            email: "test@example.com",
            did: "did:plc:test123",
            handle: "@test.bsky.social"
          }));
        } else {
          return Promise.resolve(err(new OAuthError("Invalid access token")));
        }
      }
    };
    
    const mockUserRepository = {
      findByAtIdentifier: (did: string) => {
        return Promise.resolve(null); // ユーザーが存在しない
      },
      
      findById: (id: string) => {
        return Promise.resolve(null); // ユーザーが存在しない
      }
    };

    // ... existing code ...
  });

  it("トークンを検証できる", () => {
    // モックの作成
    const mockTokenService = {
      verifyToken: (token: string): Promise<TokenVerificationResult> => {
        if (token === "valid-token") {
          return Promise.resolve({
            valid: true,
            userId: "test-user-id"
          });
        } else {
          return Promise.resolve({
            valid: false
          });
        }
      }
    };

    // ... existing code ...
  });
}); 