import { Result } from "npm:neverthrow";
import { InfrastructureError } from "../../../core/errors/base.ts";

/**
 * AT Protocolアダプターのエラー型
 */
export class AtProtocolError extends InfrastructureError {
  override readonly cause?: Error;

  constructor(message: string, cause?: Error) {
    super(message);
    this.name = "AtProtocolError";
    this.cause = cause;
  }
}

/**
 * ユーザープロファイル情報
 */
export interface AtpProfile {
  did: string;
  handle: string;
  displayName?: string;
  description?: string;
  avatar?: string;
  banner?: string;
  followsCount: number;
  followersCount: number;
  postsCount: number;
  indexedAt: string;
}

/**
 * 投稿情報
 */
export interface AtpPost {
  uri: string;
  cid: string;
  author: {
    did: string;
    handle: string;
  };
  record: {
    text: string;
    createdAt: string;
    langs?: string[];
    tags?: string[];
    labels?: string[];
  };
  embed?: {
    type: string;
    [key: string]: unknown;
  };
  replyCount: number;
  repostCount: number;
  likeCount: number;
  indexedAt: string;
}

/**
 * フィード情報
 */
export interface AtpFeed {
  uri: string;
  cid: string;
  creator: {
    did: string;
    handle: string;
  };
  name: string;
  description?: string;
  avatar?: string;
  likeCount: number;
  viewerIsLiking: boolean;
  indexedAt: string;
}

/**
 * AT Protocolアダプターのインターフェース
 * 
 * AT Protocolとの通信を抽象化するインターフェース
 */
export interface AtProtocolAdapter {
  /**
   * ユーザーの認証を行う
   * 
   * @param identifier ユーザー識別子（ハンドルまたはDID）
   * @param password パスワード
   * @returns 認証結果のResult
   */
  login(identifier: string, password: string): Promise<Result<{ did: string; handle: string; jwt: string }, AtProtocolError>>;

  /**
   * ユーザープロファイルを取得する
   * 
   * @param actor ユーザー識別子（ハンドルまたはDID）
   * @returns プロファイル情報のResult
   */
  getProfile(actor: string): Promise<Result<AtpProfile, AtProtocolError>>;

  /**
   * 投稿を作成する
   * 
   * @param text 投稿テキスト
   * @param options 投稿オプション
   * @returns 投稿結果のResult
   */
  createPost(text: string, options?: {
    langs?: string[];
    tags?: string[];
    embed?: {
      type: string;
      [key: string]: unknown;
    };
  }): Promise<Result<{ uri: string; cid: string }, AtProtocolError>>;

  /**
   * 投稿を取得する
   * 
   * @param uri 投稿URI
   * @returns 投稿情報のResult
   */
  getPost(uri: string): Promise<Result<AtpPost, AtProtocolError>>;

  /**
   * ユーザーの投稿一覧を取得する
   * 
   * @param actor ユーザー識別子（ハンドルまたはDID）
   * @param limit 取得件数（デフォルト: 50）
   * @param cursor ページングカーソル
   * @returns 投稿一覧のResult
   */
  getUserPosts(actor: string, limit?: number, cursor?: string): Promise<Result<{ posts: AtpPost[]; cursor?: string }, AtProtocolError>>;

  /**
   * フィードを作成する
   * 
   * @param name フィード名
   * @param description フィードの説明
   * @returns フィード作成結果のResult
   */
  createFeed(name: string, description?: string): Promise<Result<{ uri: string; cid: string }, AtProtocolError>>;

  /**
   * フィードを取得する
   * 
   * @param uri フィードURI
   * @returns フィード情報のResult
   */
  getFeed(uri: string): Promise<Result<AtpFeed, AtProtocolError>>;

  /**
   * フィードに投稿を追加する
   * 
   * @param feedUri フィードURI
   * @param postUri 投稿URI
   * @returns 追加結果のResult
   */
  addPostToFeed(feedUri: string, postUri: string): Promise<Result<{ uri: string; cid: string }, AtProtocolError>>;

  /**
   * フィードから投稿を削除する
   * 
   * @param feedUri フィードURI
   * @param postUri 投稿URI
   * @returns 削除結果のResult
   */
  removePostFromFeed(feedUri: string, postUri: string): Promise<Result<void, AtProtocolError>>;
} 