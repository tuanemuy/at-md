/**
 * DID取得クエリ
 * DIDを指定してユーザーを取得するためのクエリ
 */

import { Query } from "../../common/query.ts";
import { Result, ok, err } from "npm:neverthrow";
import { UserAggregate } from "../../../core/account/aggregates/user-aggregate.ts";
import { UserRepository } from "../repositories/user-repository.ts";

/**
 * DID取得クエリ
 */
export interface GetUserByDidQuery extends Query {
  readonly name: "GetUserByDid";
  readonly did: string;
}

/**
 * DID取得クエリハンドラー
 */
export class GetUserByDidQueryHandler {
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
   * @param query DID取得クエリ
   * @returns 取得されたユーザー集約
   */
  async execute(query: GetUserByDidQuery): Promise<Result<UserAggregate, Error>> {
    try {
      // DIDでユーザーを検索
      const user = await this.userRepository.findByDid(query.did);
      
      // ユーザーが存在しない場合はエラーを返す
      if (!user) {
        return err(new Error(`DID ${query.did} のユーザーが見つかりません`));
      }
      
      return ok(user);
    } catch (error) {
      return err(error instanceof Error ? error : new Error(String(error)));
    }
  }
} 