/**
 * ユーザー名取得クエリ
 * ユーザー名を指定してユーザーを取得するためのクエリ
 */

import { Query } from "../../common/query.ts";
import { Result, ok, err } from "npm:neverthrow";
import { UserAggregate } from "../../../core/account/aggregates/user-aggregate.ts";
import { UserRepository } from "../repositories/user-repository.ts";

/**
 * ユーザー名取得クエリ
 */
export interface GetUserByUsernameQuery extends Query {
  readonly name: "GetUserByUsername";
  readonly username: string;
}

/**
 * ユーザー名取得クエリハンドラー
 */
export class GetUserByUsernameQueryHandler {
  private userRepository: UserRepository;
  
  /**
   * コンストラクタ
   * @param userRepository ユーザーリポジトリ
   */
  constructor(userRepository: UserRepository) {
    this.userRepository = userRepository;
  }
  
  /**
   * クエリを実行する
   * @param query ユーザー名取得クエリ
   * @returns 取得されたユーザー集約
   */
  async execute(query: GetUserByUsernameQuery): Promise<Result<UserAggregate, Error>> {
    try {
      // ユーザー名でユーザーを検索
      const user = await this.userRepository.findByUsername(query.username);
      
      // ユーザーが存在しない場合はエラーを返す
      if (!user) {
        return err(new Error(`ユーザー名 ${query.username} のユーザーが見つかりません`));
      }
      
      return ok(user);
    } catch (error) {
      return err(error instanceof Error ? error : new Error(String(error)));
    }
  }
} 