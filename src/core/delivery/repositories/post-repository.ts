/**
 * 投稿リポジトリインターフェース
 * 投稿の永続化を担当するリポジトリのインターフェース
 */

import { PostAggregate } from "../aggregates/post-aggregate.ts";
import { TransactionContext } from "./transaction-context.ts";
import { Result } from "../deps.ts";
import { DomainError } from "../../errors/mod.ts";

/**
 * 投稿リポジトリインターフェース
 */
export interface PostRepository {
  /**
   * IDによって投稿を検索する
   * @param id 投稿ID
   * @returns 投稿集約、存在しない場合はnull
   */
  findById(id: string): Promise<PostAggregate | null>;
  
  /**
   * コンテンツIDによって投稿を検索する
   * @param contentId コンテンツID
   * @returns 投稿集約、存在しない場合はnull
   */
  findByContentId(contentId: string): Promise<PostAggregate | null>;
  
  /**
   * ユーザーIDによって投稿を検索する
   * @param userId ユーザーID
   * @param options 検索オプション
   * @returns 投稿集約の配列
   */
  findByUserId(userId: string, options?: {
    limit?: number;
    offset?: number;
    status?: string;
  }): Promise<PostAggregate[]>;
  
  /**
   * 投稿を保存する
   * @param postAggregate 投稿集約
   * @returns 保存された投稿集約
   */
  save(postAggregate: PostAggregate): Promise<PostAggregate>;
  
  /**
   * トランザクション内で投稿を保存する
   * @param postAggregate 投稿集約
   * @param context トランザクションコンテキスト
   * @returns 保存された投稿集約の結果
   */
  saveWithTransaction(
    postAggregate: PostAggregate, 
    context: TransactionContext
  ): Promise<Result<PostAggregate, DomainError>>;
  
  /**
   * 投稿を削除する
   * @param id 投稿ID
   * @returns 削除に成功した場合はtrue、それ以外はfalse
   */
  delete(id: string): Promise<boolean>;
  
  /**
   * トランザクション内で投稿を削除する
   * @param id 投稿ID
   * @param context トランザクションコンテキスト
   * @returns 削除結果
   */
  deleteWithTransaction(
    id: string, 
    context: TransactionContext
  ): Promise<Result<boolean, DomainError>>;
} 