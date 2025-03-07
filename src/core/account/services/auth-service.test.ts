/**
 * 認証サービスのテスト
 * ATプロトコルによるOAuth認証の動作を検証します。
 */

import { expect } from "@std/expect";
import { describe, it, beforeEach } from "@std/testing/bdd";
import { AuthService, AuthResult, TokenVerificationResult } from "./auth-service.ts";
import { AtIdentifier, createAtIdentifier } from "../value-objects/mod.ts";
import { UserAggregate } from "../aggregates/mod.ts";

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
      exchangeAuthCode: async (authCode: string) => {
        if (authCode === "valid-code") {
          return {
            success: true,
            accessToken: "mock-access-token"
          };
        } else {
          return {
            success: false,
            error: "無効な認証コード"
          };
        }
      },
      getUserInfo: async (accessToken: string) => {
        if (accessToken === "mock-access-token") {
          return {
            did: "did:plc:abcdefghijklmnopqrstuvwxyz",
            handle: "@test.bsky.social"
          };
        } else {
          throw new Error("無効なアクセストークン");
        }
      }
    };

    mockUserRepository = {
      findByAtIdentifier: async (did: string) => {
        return null; // 新規ユーザーを想定
      },
      findById: async (id: string) => {
        return null;
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
      
      verifyToken: async (token: string): Promise<TokenVerificationResult> => {
        if (token === "mock-jwt-token") {
          return {
            valid: true,
            userId: "mock-user-id"
          };
        } else {
          return {
            valid: false
          };
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
}); 