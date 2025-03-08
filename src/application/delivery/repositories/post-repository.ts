/**
 * 投稿リポジトリインターフェース
 * 投稿の永続化を担当するリポジトリのインターフェース
 */

import { PostAggregate } from "../../../core/delivery/aggregates/post-aggregate.ts";

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
   * 投稿を削除する
   * @param id 投稿ID
   * @returns 削除に成功した場合はtrue、それ以外はfalse
   */
  delete(id: string): Promise<boolean>;
} 