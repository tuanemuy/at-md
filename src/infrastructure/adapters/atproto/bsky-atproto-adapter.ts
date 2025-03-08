import { Result, err, ok } from "npm:neverthrow";
import { BskyAgent } from "npm:@atproto/api";
import { AtProtocolAdapter, AtProtocolError, AtpProfile, AtpPost, AtpFeed } from "./atproto-adapter.ts";

/**
 * Bluesky AT Protocol SDKを使用したAT Protocolアダプターの実装
 */
export class BskyAtProtocolAdapter implements AtProtocolAdapter {
  private agent: BskyAgent;
  private serviceUrl: string;

  /**
   * コンストラクタ
   * 
   * @param serviceUrl サービスURL（デフォルト: https://bsky.social）
   */
  constructor(serviceUrl = "https://bsky.social") {
    this.serviceUrl = serviceUrl;
    this.agent = new BskyAgent({ service: serviceUrl });
  }

  /**
   * ユーザーの認証を行う
   * 
   * @param identifier ユーザー識別子（ハンドルまたはDID）
   * @param password パスワード
   * @returns 認証結果のResult
   */
  async login(identifier: string, password: string): Promise<Result<{ did: string; handle: string; jwt: string }, AtProtocolError>> {
    try {
      const response = await this.agent.login({ identifier, password });
      
      return ok({
        did: response.data.did,
        handle: response.data.handle,
        jwt: response.data.accessJwt,
      });
    } catch (error) {
      return err(new AtProtocolError(`Failed to login as ${identifier}`, error as Error));
    }
  }

  /**
   * ユーザープロファイルを取得する
   * 
   * @param actor ユーザー識別子（ハンドルまたはDID）
   * @returns プロファイル情報のResult
   */
  async getProfile(actor: string): Promise<Result<AtpProfile, AtProtocolError>> {
    try {
      const response = await this.agent.getProfile({ actor });
      
      // APIレスポンスから必要なプロパティを抽出し、不足しているプロパティにはデフォルト値を設定
      return ok({
        did: response.data.did,
        handle: response.data.handle,
        displayName: response.data.displayName,
        description: response.data.description,
        avatar: response.data.avatar,
        banner: response.data.banner,
        followsCount: response.data.followsCount ?? 0,
        followersCount: response.data.followersCount ?? 0,
        postsCount: response.data.postsCount ?? 0,
        indexedAt: response.data.indexedAt ?? new Date().toISOString(),
      });
    } catch (error) {
      return err(new AtProtocolError(`Failed to get profile for ${actor}`, error as Error));
    }
  }

  /**
   * 投稿を作成する
   * 
   * @param text 投稿テキスト
   * @param options 投稿オプション
   * @returns 投稿結果のResult
   */
  async createPost(text: string, options?: {
    langs?: string[];
    tags?: string[];
    embed?: {
      type: string;
      [key: string]: unknown;
    };
  }): Promise<Result<{ uri: string; cid: string }, AtProtocolError>> {
    try {
      // エージェントが認証されていることを確認
      if (!this.agent.session) {
        return err(new AtProtocolError("Not authenticated. Call login() first."));
      }

      // Bluesky APIの型に合わせて変換
      const embed = options?.embed ? { $type: options.embed.type, ...options.embed } : undefined;

      // @ts-ignore: Bluesky APIの型が複雑なため、型チェックを無視
      const response = await this.agent.post({
        text,
        langs: options?.langs,
        tags: options?.tags,
        embed,
      });
      
      return ok({
        uri: response.uri,
        cid: response.cid,
      });
    } catch (error) {
      return err(new AtProtocolError("Failed to create post", error as Error));
    }
  }

  /**
   * 投稿を取得する
   * 
   * @param uri 投稿URI
   * @returns 投稿情報のResult
   */
  async getPost(uri: string): Promise<Result<AtpPost, AtProtocolError>> {
    try {
      const { repo, rkey } = this.parseAtUri(uri);
      
      // @ts-ignore: Bluesky APIの型が複雑なため、型チェックを無視
      const response = await this.agent.getPost({ repo, rkey });
      
      // APIレスポンスをマッピング
      // @ts-ignore: Bluesky APIの型が複雑なため、型チェックを無視
      const post = response.data.post || response.data;
      return ok(this.mapPost(post));
    } catch (error) {
      return err(new AtProtocolError(`Failed to get post ${uri}`, error as Error));
    }
  }

  /**
   * ユーザーの投稿一覧を取得する
   * 
   * @param actor ユーザー識別子（ハンドルまたはDID）
   * @param limit 取得件数（デフォルト: 50）
   * @param cursor ページングカーソル
   * @returns 投稿一覧のResult
   */
  async getUserPosts(actor: string, limit = 50, cursor?: string): Promise<Result<{ posts: AtpPost[]; cursor?: string }, AtProtocolError>> {
    try {
      // @ts-ignore: Bluesky APIの型が複雑なため、型チェックを無視
      const response = await this.agent.getAuthorFeed({
        actor,
        limit,
        cursor,
      });
      
      // @ts-ignore: Bluesky APIの型が複雑なため、型チェックを無視
      const posts = response.data.feed.map(item => this.mapPost(item.post));
      
      return ok({
        posts,
        // @ts-ignore: Bluesky APIの型が複雑なため、型チェックを無視
        cursor: response.data.cursor,
      });
    } catch (error) {
      return err(new AtProtocolError(`Failed to get posts for ${actor}`, error as Error));
    }
  }

  /**
   * フィードを作成する
   * 
   * @param name フィード名
   * @param description フィードの説明
   * @returns フィード作成結果のResult
   */
  async createFeed(name: string, description?: string): Promise<Result<{ uri: string; cid: string }, AtProtocolError>> {
    try {
      // エージェントが認証されていることを確認
      if (!this.agent.session) {
        return err(new AtProtocolError("Not authenticated. Call login() first."));
      }

      // 現在のところ、Bluesky APIではカスタムフィードの作成はサポートされていません
      // 将来的にサポートされた場合に実装する予定
      return err(new AtProtocolError("Creating custom feeds is not supported yet"));
    } catch (error) {
      return err(new AtProtocolError("Failed to create feed", error as Error));
    }
  }

  /**
   * フィードを取得する
   * 
   * @param uri フィードURI
   * @returns フィード情報のResult
   */
  async getFeed(uri: string): Promise<Result<AtpFeed, AtProtocolError>> {
    try {
      // 現在のところ、Bluesky APIではカスタムフィードの取得はサポートされていません
      // 将来的にサポートされた場合に実装する予定
      return err(new AtProtocolError("Getting custom feeds is not supported yet"));
    } catch (error) {
      return err(new AtProtocolError(`Failed to get feed ${uri}`, error as Error));
    }
  }

  /**
   * フィードに投稿を追加する
   * 
   * @param feedUri フィードURI
   * @param postUri 投稿URI
   * @returns 追加結果のResult
   */
  async addPostToFeed(feedUri: string, postUri: string): Promise<Result<{ uri: string; cid: string }, AtProtocolError>> {
    try {
      // 現在のところ、Bluesky APIではカスタムフィードへの投稿追加はサポートされていません
      // 将来的にサポートされた場合に実装する予定
      return err(new AtProtocolError("Adding posts to custom feeds is not supported yet"));
    } catch (error) {
      return err(new AtProtocolError(`Failed to add post ${postUri} to feed ${feedUri}`, error as Error));
    }
  }

  /**
   * フィードから投稿を削除する
   * 
   * @param feedUri フィードURI
   * @param postUri 投稿URI
   * @returns 削除結果のResult
   */
  async removePostFromFeed(feedUri: string, postUri: string): Promise<Result<void, AtProtocolError>> {
    try {
      // 現在のところ、Bluesky APIではカスタムフィードからの投稿削除はサポートされていません
      // 将来的にサポートされた場合に実装する予定
      return err(new AtProtocolError("Removing posts from custom feeds is not supported yet"));
    } catch (error) {
      return err(new AtProtocolError(`Failed to remove post ${postUri} from feed ${feedUri}`, error as Error));
    }
  }

  /**
   * AT URIをパースする
   * 
   * @param uri AT URI
   * @returns パース結果
   */
  private parseAtUri(uri: string): { repo: string; collection: string; rkey: string } {
    const parts = uri.split("/");
    if (parts.length !== 5 || !parts[0].startsWith("at:")) {
      throw new Error(`Invalid AT URI: ${uri}`);
    }
    
    return {
      repo: parts[2],
      collection: parts[3],
      rkey: parts[4],
    };
  }

  /**
   * Blueskyの投稿オブジェクトをマッピングする
   * 
   * @param post Blueskyの投稿オブジェクト
   * @returns マッピングされた投稿情報
   */
  private mapPost(post: any): AtpPost {
    return {
      uri: post.uri,
      cid: post.cid,
      author: {
        did: post.author.did,
        handle: post.author.handle,
      },
      record: {
        text: post.record.text,
        createdAt: post.record.createdAt,
        langs: post.record.langs,
        tags: post.record.tags,
        labels: post.record.labels,
      },
      embed: post.embed,
      replyCount: post.replyCount ?? 0,
      repostCount: post.repostCount ?? 0,
      likeCount: post.likeCount ?? 0,
      indexedAt: post.indexedAt ?? new Date().toISOString(),
    };
  }
} 