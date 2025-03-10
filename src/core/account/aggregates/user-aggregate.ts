/**
 * ユーザー集約
 * アカウント管理ドメインのユーザー集約を表します。
 */

import { User, createUser, CreateUserParams } from "../entities/user.ts";
import { Email, Username, AtIdentifier, createEmail, createUsername, createAtIdentifier } from "../value-objects/mod.ts";

/**
 * ユーザー集約のインターフェース
 */
export interface UserAggregate {
  /**
   * ユーザーエンティティ
   */
  readonly user: User;
  
  /**
   * ユーザー名を更新する
   * @param username 新しいユーザー名
   * @returns 更新されたユーザー集約
   */
  updateUsername(username: string): UserAggregate;
  
  /**
   * メールアドレスを更新する
   * @param email 新しいメールアドレス
   * @returns 更新されたユーザー集約
   */
  updateEmail(email: string): UserAggregate;
  
  /**
   * ATプロトコル識別子を更新する
   * @param did 新しいDID
   * @param handle 新しいハンドル（オプション）
   * @returns 更新されたユーザー集約
   */
  updateAtIdentifier(did: string, handle?: string): UserAggregate;
}

/**
 * ユーザー集約の作成に必要なパラメータ
 */
export interface CreateUserAggregateParams {
  id: string;
  username: string;
  email: string;
  atIdentifier: {
    did: string;
    handle?: string;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * ユーザー集約を作成する
 * @param params ユーザー集約の作成に必要なパラメータ
 * @returns ユーザー集約
 */
export function createUserAggregate(params: CreateUserAggregateParams): UserAggregate {
  // 値オブジェクトを作成
  const username = createUsername(params.username);
  const email = createEmail(params.email);
  const atIdentifier = createAtIdentifier(params.atIdentifier.did, params.atIdentifier.handle);
  
  // ユーザーエンティティを作成
  const user = createUser({
    id: params.id,
    username,
    email,
    atIdentifier,
    did: params.atIdentifier.did,
    passwordHash: "", // デフォルト値として空文字列を設定
    createdAt: params.createdAt,
    updatedAt: params.updatedAt
  });
  
  // 不変オブジェクトとして返す
  return Object.freeze({
    user,
    
    updateUsername(username: string): UserAggregate {
      const newUsername = createUsername(username);
      const updatedUser = this.user.updateUsername(newUsername);
      
      return createUserAggregateFromUser(updatedUser);
    },
    
    updateEmail(email: string): UserAggregate {
      const newEmail = createEmail(email);
      const updatedUser = this.user.updateEmail(newEmail);
      
      return createUserAggregateFromUser(updatedUser);
    },
    
    updateAtIdentifier(did: string, handle?: string): UserAggregate {
      const newAtIdentifier = createAtIdentifier(did, handle);
      const updatedUser = this.user.updateAtIdentifier(newAtIdentifier);
      
      return createUserAggregateFromUser(updatedUser);
    }
  });
}

/**
 * ユーザーエンティティからユーザー集約を作成する
 * @param user ユーザーエンティティ
 * @returns ユーザー集約
 */
function createUserAggregateFromUser(user: User): UserAggregate {
  return createUserAggregate({
    id: user.id,
    username: user.username.value,
    email: user.email.value,
    atIdentifier: {
      did: user.atIdentifier.value,
      handle: user.atIdentifier.handle
    },
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  });
} 