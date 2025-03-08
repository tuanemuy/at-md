/**
 * ユーザーリポジトリインターフェース
 * ユーザーの永続化を担当するリポジトリのインターフェース
 */

import { UserAggregate } from "../../../core/account/aggregates/user-aggregate.ts";

/**
 * ユーザーリポジトリインターフェース
 */
export interface UserRepository {
  /**
   * IDによってユーザーを検索する
   * @param id ユーザーID
   * @returns ユーザー集約、存在しない場合はnull
   */
  findById(id: string): Promise<UserAggregate | null>;
  
  /**
   * ユーザー名によってユーザーを検索する
   * @param username ユーザー名
   * @returns ユーザー集約、存在しない場合はnull
   */
  findByUsername(username: string): Promise<UserAggregate | null>;
  
  /**
   * メールアドレスによってユーザーを検索する
   * @param email メールアドレス
   * @returns ユーザー集約、存在しない場合はnull
   */
  findByEmail(email: string): Promise<UserAggregate | null>;
  
  /**
   * ATプロトコル識別子のDIDによってユーザーを検索する
   * @param did DID
   * @returns ユーザー集約、存在しない場合はnull
   */
  findByDid(did: string): Promise<UserAggregate | null>;
  
  /**
   * ATプロトコル識別子のハンドルによってユーザーを検索する
   * @param handle ハンドル
   * @returns ユーザー集約、存在しない場合はnull
   */
  findByHandle(handle: string): Promise<UserAggregate | null>;
  
  /**
   * ユーザーを保存する
   * @param userAggregate ユーザー集約
   * @returns 保存されたユーザー集約
   */
  save(userAggregate: UserAggregate): Promise<UserAggregate>;
  
  /**
   * ユーザーを削除する
   * @param id ユーザーID
   * @returns 削除に成功した場合はtrue、それ以外はfalse
   */
  delete(id: string): Promise<boolean>;
} 