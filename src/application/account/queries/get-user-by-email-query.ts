/**
 * メールアドレス取得クエリ
 * メールアドレスを指定してユーザーを取得するためのクエリ
 */

import { Query } from "../../common/query.ts";
import { Result, ok, err } from "npm:neverthrow";
import { UserAggregate } from "../../../core/account/aggregates/user-aggregate.ts";
import { UserRepository } from "../repositories/user-repository.ts";

/**
 * メールアドレス取得クエリ
 */
export interface GetUserByEmailQuery extends Query {
  readonly name: "GetUserByEmail";
  readonly email: string;
}

/**
 * メールアドレス取得クエリハンドラー
 */
export class GetUserByEmailQueryHandler {
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
   * @param query メールアドレス取得クエリ
   * @returns 取得されたユーザー集約
   */
  async execute(query: GetUserByEmailQuery): Promise<Result<UserAggregate, Error>> {
    try {
      // メールアドレスでユーザーを検索
      const user = await this.userRepository.findByEmail(query.email);
      
      // ユーザーが存在しない場合はエラーを返す
      if (!user) {
        return err(new Error(`メールアドレス ${query.email} のユーザーが見つかりません`));
      }
      
      return ok(user);
    } catch (error) {
      return err(error instanceof Error ? error : new Error(String(error)));
    }
  }
} 