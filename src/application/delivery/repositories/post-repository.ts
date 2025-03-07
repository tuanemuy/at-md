/**
 * ポストリポジトリインターフェース
 * ポストの永続化を担当するリポジトリのインターフェース
 */

import { PostAggregate } from "../../../core/delivery/aggregates/post-aggregate.ts";

/**
 * ポストリポジトリインターフェース
 */
export interface PostRepository {
  /**
   * IDによってポストを検索する
   * @param id ポストID
   * @returns ポスト集約、存在しない場合はnull
   */
  findById(id: string): Promise<PostAggregate | null>;
  
  /**
   * コンテンツIDによってポストを検索する
   * @param contentId コンテンツID
   * @returns ポスト集約、存在しない場合はnull
   */
  findByContentId(contentId: string): Promise<PostAggregate | null>;
  
  /**
   * ユーザーIDによってポストを検索する
   * @param userId ユーザーID
   * @param options 検索オプション
   * @returns ポスト集約の配列
   */
  findByUserId(userId: string, options?: {
    limit?: number;
    offset?: number;
    status?: string;
  }): Promise<PostAggregate[]>;
  
  /**
   * ポストを保存する
   * @param postAggregate ポスト集約
   * @returns 保存されたポスト集約
   */
  save(postAggregate: PostAggregate): Promise<PostAggregate>;
  
  /**
   * ポストを削除する
   * @param id ポストID
   * @returns 削除に成功した場合はtrue、それ以外はfalse
   */
  delete(id: string): Promise<boolean>;
} 