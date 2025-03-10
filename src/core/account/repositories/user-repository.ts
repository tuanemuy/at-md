/**
 * ユーザーリポジトリインターフェース
 * ユーザーの永続化を担当するリポジトリのインターフェース
 */

import { UserAggregate } from "../aggregates/user-aggregate.ts";
import { Result } from "../deps.ts";
import { DomainError } from "../../errors/mod.ts";

/**
 * トランザクションコンテキスト
 * データベーストランザクションを表すインターフェース
 */
export interface TransactionContext {
  id: string;
}

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
   * トランザクション内でユーザーを保存する
   * @param userAggregate ユーザー集約
   * @param context トランザクションコンテキスト
   * @returns 保存されたユーザー集約の結果
   */
  saveWithTransaction(
    userAggregate: UserAggregate, 
    context: TransactionContext
  ): Promise<Result<UserAggregate, DomainError>>;
  
  /**
   * ユーザーを削除する
   * @param id ユーザーID
   * @returns 削除に成功した場合はtrue、それ以外はfalse
   */
  delete(id: string): Promise<boolean>;
  
  /**
   * トランザクション内でユーザーを削除する
   * @param id ユーザーID
   * @param context トランザクションコンテキスト
   * @returns 削除結果
   */
  deleteWithTransaction(
    id: string, 
    context: TransactionContext
  ): Promise<Result<boolean, DomainError>>;
} 