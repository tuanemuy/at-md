/**
 * 認証サービス
 * ATプロトコルによるOAuth認証を管理します。
 */

import { AtIdentifier, createAtIdentifier } from "../value-objects/mod.ts";
import { UserAggregate } from "../aggregates/mod.ts";
import { UserRepository } from "../repositories/user-repository.ts";

/**
 * 認証サービスのインターフェース
 */
export interface AuthService {
  /**
   * ATプロトコルによるOAuth認証を行う
   * @param authCode 認証コード
   * @returns 認証結果
   */
  authenticateWithAtProtocol(authCode: string): Promise<AuthResult>;
  
  /**
   * 認証トークンを検証する
   * @param token 認証トークン
   * @returns 検証結果
   */
  verifyToken(token: string): Promise<TokenVerificationResult>;
}

/**
 * 認証結果
 */
export interface AuthResult {
  /**
   * 認証が成功したかどうか
   */
  success: boolean;
  
  /**
   * 認証トークン（認証成功時のみ）
   */
  token?: string;
  
  /**
   * ATプロトコル識別子（認証成功時のみ）
   */
  atIdentifier?: AtIdentifier;
  
  /**
   * エラーメッセージ（認証失敗時のみ）
   */
  errorMessage?: string;
}

/**
 * トークン検証結果
 */
export interface TokenVerificationResult {
  /**
   * 検証が成功したかどうか
   */
  valid: boolean;
  
  /**
   * ユーザーID（検証成功時のみ）
   */
  userId?: string | null;
  
  /**
   * ATプロトコル識別子（検証成功時のみ）
   */
  atIdentifier?: AtIdentifier;
  
  /**
   * エラーメッセージ（検証失敗時のみ）
   */
  errorMessage?: string;
}

/**
 * ATプロトコルクライアントインターフェース
 */
export interface AtProtocolClient {
  /**
   * 認証コードをアクセストークンに交換する
   * @param authCode 認証コード
   * @returns 交換結果
   */
  exchangeAuthCode(authCode: string): Promise<{
    success: boolean;
    accessToken?: string;
    error?: string;
  }>;

  /**
   * ユーザー情報を取得する
   * @param accessToken アクセストークン
   * @returns ユーザー情報
   */
  getUserInfo(accessToken: string): Promise<{
    did: string;
    handle?: string;
  }>;
}

/**
 * トークンペイロードの型定義
 */
interface TokenPayload {
  userId: string | null;
  did: string;
  handle?: string;
  exp: number;
}

/**
 * 認証サービスの実装
 */
export class AuthServiceImpl implements AuthService {
  /**
   * ユーザーリポジトリ
   * 実際の実装では、インフラストラクチャ層で提供されるリポジトリを使用します。
   */
  private userRepository: UserRepository;
  
  /**
   * ATプロトコルクライアント
   * 実際の実装では、インフラストラクチャ層で提供されるクライアントを使用します。
   */
  private atProtocolClient: AtProtocolClient;
  
  /**
   * コンストラクタ
   * @param userRepository ユーザーリポジトリ
   * @param atProtocolClient ATプロトコルクライアント
   */
  constructor(userRepository: UserRepository, atProtocolClient: AtProtocolClient) {
    this.userRepository = userRepository;
    this.atProtocolClient = atProtocolClient;
  }
  
  /**
   * ATプロトコルによるOAuth認証を行う
   * @param authCode 認証コード
   * @returns 認証結果
   */
  async authenticateWithAtProtocol(authCode: string): Promise<AuthResult> {
    try {
      // 認証コードを使用してATプロトコルからトークンを取得
      // 実際の実装では、ATプロトコルクライアントを使用してトークンを取得します
      const atProtocolResponse = await this.atProtocolClient.exchangeAuthCode(authCode);
      
      if (!atProtocolResponse.success) {
        return {
          success: false,
          errorMessage: atProtocolResponse.error || "認証に失敗しました"
        };
      }
      
      // ATプロトコルからユーザー情報を取得
      const userInfo = await this.atProtocolClient.getUserInfo(atProtocolResponse.accessToken!);
      
      if (!userInfo.did) {
        return {
          success: false,
          errorMessage: "ユーザー情報の取得に失敗しました"
        };
      }
      
      // ATプロトコル識別子を作成
      const atIdentifier = createAtIdentifier(userInfo.did, userInfo.handle);
      
      // ユーザーが存在するか確認
      const existingUser = await this.userRepository.findByDid(atIdentifier.value);
      
      // 認証トークンを生成
      const token = this.generateToken(existingUser ? existingUser.user.id : null, atIdentifier);
      
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
  }
  
  /**
   * 認証トークンを検証する
   * @param token 認証トークン
   * @returns 検証結果
   */
  verifyToken(token: string): Promise<TokenVerificationResult> {
    try {
      // トークンを検証
      // 実際の実装では、JWTなどのライブラリを使用してトークンを検証します
      const decoded = this.decodeToken(token);
      
      if (!decoded) {
        return Promise.resolve({
          valid: false,
          errorMessage: "無効なトークンです"
        });
      }
      
      // トークンの有効期限を確認
      if (decoded.exp < Date.now() / 1000) {
        return Promise.resolve({
          valid: false,
          errorMessage: "トークンの有効期限が切れています"
        });
      }
      
      // ATプロトコル識別子を取得
      const atIdentifier = createAtIdentifier(decoded.did, decoded.handle);
      
      return Promise.resolve({
        valid: true,
        userId: decoded.userId,
        atIdentifier
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "トークンの検証中にエラーが発生しました";
      return Promise.resolve({
        valid: false,
        errorMessage
      });
    }
  }
  
  /**
   * 認証トークンを生成する
   * @param userId ユーザーID（存在する場合）
   * @param atIdentifier ATプロトコル識別子
   * @returns 認証トークン
   */
  private generateToken(userId: string | null, atIdentifier: AtIdentifier): string {
    // 実際の実装では、JWTなどのライブラリを使用してトークンを生成します
    const payload = {
      userId,
      did: atIdentifier.value,
      handle: atIdentifier.handle,
      exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1時間の有効期限
    };
    
    // 簡易的なトークン生成（実際のアプリケーションでは使用しないでください）
    // Denoでは、TextEncoderとbtoa()を使用してBase64エンコードを行います
    const jsonString = JSON.stringify(payload);
    const base64Encoded = btoa(jsonString);
    return base64Encoded;
  }
  
  /**
   * 認証トークンをデコードする
   * @param token 認証トークン
   * @returns デコードされたペイロード
   */
  private decodeToken(token: string): TokenPayload | null {
    try {
      // 簡易的なトークンデコード（実際のアプリケーションでは使用しないでください）
      // Denoでは、atob()を使用してBase64デコードを行います
      const jsonString = atob(token);
      const payload = JSON.parse(jsonString) as TokenPayload;
      return payload;
    } catch (error) {
      return null;
    }
  }
} 