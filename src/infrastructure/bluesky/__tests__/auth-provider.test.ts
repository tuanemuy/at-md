import { expect, test, describe, vi, beforeEach } from "vitest";
import { ok, err, type Result } from "@/lib/result";
import { type ExternalServiceError, ExternalServiceErrorCode } from "@/domain/types/error";
import { DefaultBlueskyAuthProvider } from "../auth-provider";
import { Agent } from "@atproto/api";
import { NodeOAuthClient, type NodeSavedSession } from "@atproto/oauth-client-node";
import type { IncomingMessage, ServerResponse } from "node:http";
import type { RequestContext } from "@/lib/cookie";
import { profileSchema, type Profile } from "@/domain/account/models/profile";
import type { Session } from "@/domain/account/models/session";

// モックの準備
vi.mock("@atproto/oauth-client-node", () => ({
  NodeOAuthClient: vi.fn().mockImplementation(() => ({
    authorize: vi.fn(),
    callback: vi.fn(),
    restore: vi.fn()
  }))
}));

vi.mock("@atproto/api", () => ({
  Agent: vi.fn().mockImplementation(() => ({
    assertDid: "did:plc:test123",
    com: {
      atproto: {
        repo: {
          getRecord: vi.fn()
        }
      }
    }
  }))
}));

// profileSchemaをモック
vi.mock("@/domain/account/models/profile", () => ({
  profileSchema: {
    parse: vi.fn().mockImplementation((value) => {
      if (!value || !value.displayName) {
        // データが存在しない場合はデフォルト値を返す
        return {
          displayName: "Test User",
          description: "Test bio",
          avatar: null
        };
      }
      
      // データが存在する場合はそのまま返す
      return {
        displayName: value.displayName,
        description: value.description || "No description",
        avatar: value.avatar || null
      };
    })
  }
}));

interface MockNodeOAuthClient {
  authorize: ReturnType<typeof vi.fn>;
  callback: ReturnType<typeof vi.fn>;
  restore: ReturnType<typeof vi.fn>;
}

interface MockAgent {
  assertDid: string;
  com: {
    atproto: {
      repo: {
        getRecord: ReturnType<typeof vi.fn>;
      }
    }
  }
}

describe("DefaultBlueskyAuthProvider", () => {
  let authProvider: DefaultBlueskyAuthProvider;
  let mockOAuthClient: MockNodeOAuthClient;
  let mockAgent: MockAgent;
  let mockReq: IncomingMessage;
  let mockRes: ServerResponse;
  let mockContext: RequestContext;

  // テスト用の設定
  const testConfig = {
    publicUrl: "https://example.com"
  };

  beforeEach(() => {
    vi.resetAllMocks();
    
    // OAuthクライアントのモック
    mockOAuthClient = {
      authorize: vi.fn(),
      callback: vi.fn(),
      restore: vi.fn()
    };
    (NodeOAuthClient as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => mockOAuthClient);
    
    // Agentのモック設定を明示的に行う
    mockAgent = {
      assertDid: "did:plc:test123",
      com: {
        atproto: {
          repo: {
            getRecord: vi.fn()
          }
        }
      }
    };
    
    (Agent as unknown as ReturnType<typeof vi.fn>).mockImplementation(() => {
      return mockAgent;
    });

    // リクエストコンテキストのモック
    mockReq = { headers: { cookie: '' } } as IncomingMessage;
    
    mockRes = {
      getHeader: vi.fn().mockReturnValue(null),
      setHeader: vi.fn()
    } as unknown as ServerResponse;

    mockContext = { req: mockReq, res: mockRes };

    // 認証プロバイダーの作成
    authProvider = new DefaultBlueskyAuthProvider(testConfig);
  });

  test("認証URLを生成すると正しいURLが返されること", async () => {
    // 準備
    const mockUrl = new URL("https://bsky.social/oauth/authorize?client_id=test-client-id&redirect_uri=https%3A%2F%2Fexample.com%2Fcallback&response_type=code&scope=atproto%20transition%3Ageneric&handle=test-user");
    mockOAuthClient.authorize.mockResolvedValue(mockUrl);

    // 実行
    const handle = "test-user";
    const result = await authProvider.authorize(handle, mockContext);

    // 検証
    expect(NodeOAuthClient).toHaveBeenCalled();
    expect(mockOAuthClient.authorize).toHaveBeenCalledWith(handle, {
      scope: "'atproto transition:generic'"
    });
    
    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).toBe(mockUrl);
    }
  });

  test("アクセストークンの取得に成功するとセッション情報が返されること", async () => {
    // 準備
    const params = new URLSearchParams({
      code: "test-auth-code"
    });

    const mockSession = {
      did: "did:plc:test123",
      accessJwt: "test-access-token",
      refreshJwt: "test-refresh-token"
    };

    mockOAuthClient.callback.mockResolvedValue({ session: mockSession });

    // 実行
    const result = await authProvider.callback(params, mockContext);

    // 検証
    expect(NodeOAuthClient).toHaveBeenCalled();
    expect(mockOAuthClient.callback).toHaveBeenCalledWith(params);

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      const session: Session = result.value;
      expect(session.did).toBe(mockSession.did);
    }
  });

  test("アクセストークンの取得に失敗するとエラーが返されること", async () => {
    // 準備
    const params = new URLSearchParams({
      code: "test-auth-code"
    });

    const mockError = new Error("OAuth client error");
    mockOAuthClient.callback.mockRejectedValue(mockError);

    // 実行
    const result = await authProvider.callback(params, mockContext);

    // 検証
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      const error: ExternalServiceError = result.error;
      expect(error.code).toBe("authentication_failed");
      expect(error.serviceName).toBe("BlueskyAuth");
      expect(error.message).toBe("Failed to retrieve Bluesky session");
      expect(error.cause).toBe(mockError);
    }
  });

  test("プロフィール情報の取得に成功するとプロフィールが返されること", async () => {
    // 準備
    const did = "did:plc:test123";
    
    // OAuthクライアントのモックをリセット
    mockOAuthClient.restore = vi.fn().mockResolvedValue({
      did: "did:plc:test123",
      tokenSet: {
        access_token: "test-access-token",
        refresh_token: "test-refresh-token",
        id_token: null
      }
    });

    // getRecordの応答を設定
    const mockProfileData = {
      displayName: "Test User",
      description: "Test bio",
      avatar: {
        $type: "blob",
        ref: {
          $link: "test-link"
        },
        mimeType: "image/jpeg",
        size: 1000
      }
    };
    
    // mockAgentを適切に設定
    mockAgent.com.atproto.repo.getRecord = vi.fn().mockResolvedValue({
      data: {
        value: mockProfileData
      }
    });

    // profileSchemaのモックが確実に値を返すことを確認
    (profileSchema.parse as ReturnType<typeof vi.fn>).mockReturnValue({
      displayName: "Test User",
      description: "Test bio",
      avatar: null
    });

    console.log("Before getUserProfile call");
    
    // 実行
    const result = await authProvider.getUserProfile(did, mockContext);
    
    console.log("After getUserProfile call");
    console.log("Result:", JSON.stringify(result));
    if (result.isErr()) {
      console.log("Error:", result.error);
    }

    // 検証
    expect(mockOAuthClient.restore).toHaveBeenCalledWith(did);
    expect(Agent).toHaveBeenCalled();
    expect(mockAgent.com.atproto.repo.getRecord).toHaveBeenCalled();
    expect(profileSchema.parse).toHaveBeenCalled();

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.displayName).toBe("Test User");
      expect(result.value.description).toBe("Test bio");
    }
  });

  test("プロフィール情報の取得に失敗するとエラーが返されること", async () => {
    // 準備
    const did = "did:plc:test123";
    const mockError = new Error("Profile fetch error");
    mockOAuthClient.restore.mockResolvedValue({} as NodeSavedSession);
    mockAgent.com.atproto.repo.getRecord.mockRejectedValue(mockError);

    // 実行
    const result = await authProvider.getUserProfile(did, mockContext);

    // 検証
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      const error: ExternalServiceError = result.error;
      expect(error.code).toBe("profile_retrieval_failed");
      expect(error.serviceName).toBe("BlueskyAuth");
      expect(error.message).toBe("Failed to retrieve Bluesky profile");
      expect(error.cause).toBe(mockError);
    }
  });

  test("セッションの復元に失敗するとエラーが返されること", async () => {
    // 準備
    const did = "did:plc:test123";
    mockOAuthClient.restore.mockResolvedValue(null);

    // 実行
    const result = await authProvider.getUserProfile(did, mockContext);

    // 検証
    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      const error: ExternalServiceError = result.error;
      expect(error.code).toBe("profile_retrieval_failed");
      expect(error.serviceName).toBe("BlueskyAuth");
      expect(error.message).toBe("Failed to retrieve Bluesky profile");
    }
  });
}); 