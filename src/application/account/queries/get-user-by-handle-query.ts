/**
 * ハンドル取得クエリ
 * ハンドルを指定してユーザーを取得するためのクエリ
 */

import { Query } from "../../common/mod.ts";
import { Result, ok, err } from "../deps.ts";
import { UserAggregate } from "../deps.ts";
import { UserRepository } from "../repositories/user-repository.ts";

/**
 * ハンドル取得クエリ
 */
export interface GetUserByHandleQuery extends Query {
  readonly name: "GetUserByHandle";
  readonly handle: string;
}

/**
 * ハンドル取得クエリハンドラー
 */
export class GetUserByHandleQueryHandler {
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
   * @param query ハンドル取得クエリ
   * @returns 取得されたユーザー集約
   */
  async execute(query: GetUserByHandleQuery): Promise<Result<UserAggregate, Error>> {
    try {
      // ハンドルでユーザーを検索
      const user = await this.userRepository.findByHandle(query.handle);
      
      // ユーザーが存在しない場合はエラーを返す
      if (!user) {
        return err(new Error(`ハンドル ${query.handle} のユーザーが見つかりません`));
      }
      
      return ok(user);
    } catch (error) {
      return err(error instanceof Error ? error : new Error(String(error)));
    }
  }
} 