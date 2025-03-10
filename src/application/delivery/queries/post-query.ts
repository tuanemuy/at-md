/**
 * 投稿クエリ
 * 投稿に関する問い合わせを処理するクエリ
 */

import { Query, QueryHandler } from "../../common/mod.ts";
import { Result, ok, err } from "npm:neverthrow";
import { PostAggregate } from "../../../core/delivery/mod.ts";
import { PostRepository } from "../repositories/mod.ts";
import { ApplicationError, EntityNotFoundError } from "../../../core/errors/mod.ts";

/**
 * 投稿をIDで取得するクエリ
 */
export interface GetPostByIdQuery extends Query {
  readonly name: "GetPostById";
  readonly id: string;
}

/**
 * コンテンツIDで投稿を取得するクエリ
 */
export interface GetPostByContentIdQuery extends Query {
  readonly name: "GetPostByContentId";
  readonly contentId: string;
}

/**
 * ユーザーの投稿一覧を取得するクエリ
 */
export interface GetPostsByUserIdQuery extends Query {
  readonly name: "GetPostsByUserId";
  readonly userId: string;
  readonly limit?: number;
  readonly offset?: number;
  readonly status?: string;
}

/**
 * 投稿をIDで取得するクエリハンドラー
 */
export class GetPostByIdQueryHandler {
  private postRepository: PostRepository;
  
  /**
   * コンストラクタ
   * @param postRepository 投稿リポジトリ
   */
  constructor(postRepository: PostRepository) {
    this.postRepository = postRepository;
  }
  
  /**
   * クエリを実行する
   * @param query 投稿をIDで取得するクエリ
   * @returns 投稿集約
   */
  async execute(query: GetPostByIdQuery): Promise<Result<PostAggregate | null, Error>> {
    try {
      const post = await this.postRepository.findById(query.id);
      return ok(post);
    } catch (error) {
      return err(error instanceof Error ? error : new Error(String(error)));
    }
  }
}

/**
 * コンテンツIDで投稿を取得するクエリハンドラー
 */
export class GetPostByContentIdQueryHandler {
  private postRepository: PostRepository;
  
  /**
   * コンストラクタ
   * @param postRepository 投稿リポジトリ
   */
  constructor(postRepository: PostRepository) {
    this.postRepository = postRepository;
  }
  
  /**
   * クエリを実行する
   * @param query コンテンツIDで投稿を取得するクエリ
   * @returns 投稿集約
   */
  async execute(query: GetPostByContentIdQuery): Promise<Result<PostAggregate | null, Error>> {
    try {
      const post = await this.postRepository.findByContentId(query.contentId);
      return ok(post);
    } catch (error) {
      return err(error instanceof Error ? error : new Error(String(error)));
    }
  }
}

/**
 * ユーザーの投稿一覧を取得するクエリハンドラー
 */
export class GetPostsByUserIdQueryHandler {
  private postRepository: PostRepository;
  
  /**
   * コンストラクタ
   * @param postRepository 投稿リポジトリ
   */
  constructor(postRepository: PostRepository) {
    this.postRepository = postRepository;
  }
  
  /**
   * クエリを実行する
   * @param query ユーザーの投稿一覧を取得するクエリ
   * @returns 投稿集約の配列
   */
  async execute(query: GetPostsByUserIdQuery): Promise<Result<PostAggregate[], Error>> {
    try {
      const posts = await this.postRepository.findByUserId(query.userId, {
        limit: query.limit,
        offset: query.offset,
        status: query.status
      });
      return ok(posts);
    } catch (error) {
      return err(error instanceof Error ? error : new Error(String(error)));
    }
  }
}