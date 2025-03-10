/**
 * ユーザーID取得クエリ
 * ユーザーIDを指定してユーザーを取得するためのクエリ
 */

import { Query } from "../../common/mod.ts";
import { Result, ok, err } from "../deps.ts";
import { UserAggregate } from "../deps.ts";
import { UserRepository } from "../repositories/user-repository.ts";

/**
 * ユーザーID取得クエリ
 */
export interface GetUserByIdQuery extends Query {
  readonly name: "GetUserById";
  readonly id: string;
}

/**
 * ユーザーID取得クエリハンドラー
 */
export class GetUserByIdQueryHandler {
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
   * @param query ユーザーID取得クエリ
   * @returns 取得されたユーザー集約
   */
  async execute(query: GetUserByIdQuery): Promise<Result<UserAggregate, Error>> {
    try {
      // ユーザーIDでユーザーを検索
      const user = await this.userRepository.findById(query.id);
      
      // ユーザーが存在しない場合はエラーを返す
      if (!user) {
        return err(new Error(`ID ${query.id} のユーザーが見つかりません`));
      }
      
      return ok(user);
    } catch (error) {
      return err(error instanceof Error ? error : new Error(String(error)));
    }
  }
} 