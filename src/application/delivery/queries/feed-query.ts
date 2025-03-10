/**
 * フィードクエリ
 * フィードに関する問い合わせを処理するクエリ
 */

import { Query, QueryHandler } from "../../common/mod.ts";
import { Result, ok, err } from "npm:neverthrow";
import { FeedAggregate } from "../../../core/delivery/mod.ts";
import { FeedRepository } from "../repositories/mod.ts";
import { ApplicationError, EntityNotFoundError } from "../../../core/errors/mod.ts";

/**
 * フィードをIDで取得するクエリ
 */
export interface GetFeedByIdQuery extends Query {
  readonly name: "GetFeedById";
  readonly id: string;
}

/**
 * ユーザーのフィード一覧を取得するクエリ
 */
export interface GetFeedsByUserIdQuery extends Query {
  readonly name: "GetFeedsByUserId";
  readonly userId: string;
  readonly limit?: number;
  readonly offset?: number;
}

/**
 * フィードを名前で取得するクエリ
 */
export interface GetFeedByNameQuery extends Query {
  readonly name: "GetFeedByName";
  readonly userId: string;
  readonly feedName: string;
}

/**
 * フィードをIDで取得するクエリハンドラー
 */
export class GetFeedByIdQueryHandler {
  private feedRepository: FeedRepository;
  
  /**
   * コンストラクタ
   * @param feedRepository フィードリポジトリ
   */
  constructor(feedRepository: FeedRepository) {
    this.feedRepository = feedRepository;
  }
  
  /**
   * クエリを実行する
   * @param query フィードをIDで取得するクエリ
   * @returns フィード集約
   */
  async execute(query: GetFeedByIdQuery): Promise<Result<FeedAggregate | null, Error>> {
    try {
      const feed = await this.feedRepository.findById(query.id);
      return ok(feed);
    } catch (error) {
      return err(error instanceof Error ? error : new Error(String(error)));
    }
  }
}

/**
 * ユーザーのフィード一覧を取得するクエリハンドラー
 */
export class GetFeedsByUserIdQueryHandler {
  private feedRepository: FeedRepository;
  
  /**
   * コンストラクタ
   * @param feedRepository フィードリポジトリ
   */
  constructor(feedRepository: FeedRepository) {
    this.feedRepository = feedRepository;
  }
  
  /**
   * クエリを実行する
   * @param query ユーザーのフィード一覧を取得するクエリ
   * @returns フィード集約の配列
   */
  async execute(query: GetFeedsByUserIdQuery): Promise<Result<FeedAggregate[], Error>> {
    try {
      const feeds = await this.feedRepository.findByUserId(query.userId, {
        limit: query.limit,
        offset: query.offset
      });
      return ok(feeds);
    } catch (error) {
      return err(error instanceof Error ? error : new Error(String(error)));
    }
  }
}

/**
 * フィードを名前で取得するクエリハンドラー
 */
export class GetFeedByNameQueryHandler {
  private feedRepository: FeedRepository;
  
  /**
   * コンストラクタ
   * @param feedRepository フィードリポジトリ
   */
  constructor(feedRepository: FeedRepository) {
    this.feedRepository = feedRepository;
  }
  
  /**
   * クエリを実行する
   * @param query フィードを名前で取得するクエリ
   * @returns フィード集約
   */
  async execute(query: GetFeedByNameQuery): Promise<Result<FeedAggregate | null, Error>> {
    try {
      const feed = await this.feedRepository.findByName(query.userId, query.feedName);
      return ok(feed);
    } catch (error) {
      return err(error instanceof Error ? error : new Error(String(error)));
    }
  }
} 