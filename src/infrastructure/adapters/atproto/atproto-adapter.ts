/**
 * AtProtoアダプター
 */

import {
  Result,
  ok,
  err,
  BskyAgent,
  ApplicationError
} from "./deps.ts";

/**
 * AtProtoアダプターのエラー
 */
export class AtProtocolError extends ApplicationError {
  override readonly cause?: Error;
  
  constructor(message: string, cause?: Error) {
    super(message);
    this.name = "AtProtocolError";
    this.cause = cause;
  }
}

/**
 * AtProtoプロファイル
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
 * AtProto投稿
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
 * AtProtoフィード
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
 * AtProtoアダプターのインターフェース
 */
export interface AtProtoAdapter {
  /**
   * ログインする
   * @param identifier 識別子（ハンドルまたはメールアドレス）
   * @param password パスワード
   * @returns 結果
   */
  login(identifier: string, password: string): Promise<Result<void, ApplicationError>>;
  
  /**
   * 投稿する
   * @param text 投稿テキスト
   * @returns 投稿ID
   */
  post(text: string): Promise<Result<string, ApplicationError>>;
  
  /**
   * 投稿を削除する
   * @param postId 投稿ID
   * @returns 結果
   */
  deletePost(postId: string): Promise<Result<void, ApplicationError>>;
}

/**
 * AtProtoアダプターの実装
 */
export class AtProtoAdapterImpl implements AtProtoAdapter {
  private agent: BskyAgent;
  private isLoggedIn = false;
  
  /**
   * コンストラクタ
   * @param serviceUrl サービスURL
   */
  constructor(serviceUrl: string = "https://bsky.social") {
    this.agent = new BskyAgent({ service: serviceUrl });
  }
  
  /**
   * ログインする
   * @param identifier 識別子（ハンドルまたはメールアドレス）
   * @param password パスワード
   * @returns 結果
   */
  async login(identifier: string, password: string): Promise<Result<void, ApplicationError>> {
    try {
      await this.agent.login({ identifier, password });
      this.isLoggedIn = true;
      return ok(undefined);
    } catch (error) {
      return err(new ApplicationError(`ログインに失敗しました: ${error instanceof Error ? error.message : String(error)}`));
    }
  }
  
  /**
   * 投稿する
   * @param text 投稿テキスト
   * @returns 投稿ID
   */
  async post(text: string): Promise<Result<string, ApplicationError>> {
    if (!this.isLoggedIn) {
      return err(new ApplicationError("投稿するにはログインが必要です"));
    }
    
    try {
      const response = await this.agent.post({
        text,
        createdAt: new Date().toISOString()
      });
      
      return ok(response.uri.split("/").pop() || "");
    } catch (error) {
      return err(new ApplicationError(`投稿に失敗しました: ${error instanceof Error ? error.message : String(error)}`));
    }
  }
  
  /**
   * 投稿を削除する
   * @param postId 投稿ID
   * @returns 結果
   */
  async deletePost(postId: string): Promise<Result<void, ApplicationError>> {
    if (!this.isLoggedIn) {
      return err(new ApplicationError("投稿を削除するにはログインが必要です"));
    }
    
    try {
      const did = this.agent.session?.did;
      if (!did) {
        return err(new ApplicationError("DIDが取得できませんでした"));
      }
      
      await this.agent.deletePost(`at://${did}/app.bsky.feed.post/${postId}`);
      return ok(undefined);
    } catch (error) {
      return err(new ApplicationError(`投稿の削除に失敗しました: ${error instanceof Error ? error.message : String(error)}`));
    }
  }
}

/**
 * AtProtocolアダプターのインターフェース
 */
export interface AtProtocolAdapter {
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