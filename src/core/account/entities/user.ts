/**
 * ユーザーエンティティ
 * アカウント管理ドメインのユーザーを表します。
 */

import { Email, Username, AtIdentifier } from "../value-objects/mod.ts";

/**
 * ユーザーエンティティのインターフェース
 */
export interface User {
  /**
   * ユーザーID
   */
  readonly id: string;
  
  /**
   * ユーザー名
   */
  readonly username: Username;
  
  /**
   * メールアドレス
   */
  readonly email: Email;
  
  /**
   * ATプロトコル識別子
   */
  readonly atIdentifier: AtIdentifier;
  
  /**
   * 作成日時
   */
  readonly createdAt: Date;
  
  /**
   * 更新日時
   */
  readonly updatedAt: Date;
  
  /**
   * ユーザー名を更新する
   * @param username 新しいユーザー名
   * @returns 更新されたユーザーエンティティ
   */
  updateUsername(username: Username): User;
  
  /**
   * メールアドレスを更新する
   * @param email 新しいメールアドレス
   * @returns 更新されたユーザーエンティティ
   */
  updateEmail(email: Email): User;
  
  /**
   * ATプロトコル識別子を更新する
   * @param atIdentifier 新しいATプロトコル識別子
   * @returns 更新されたユーザーエンティティ
   */
  updateAtIdentifier(atIdentifier: AtIdentifier): User;
}

/**
 * ユーザーエンティティの作成に必要なパラメータ
 */
export interface CreateUserParams {
  id: string;
  username: Username;
  email: Email;
  atIdentifier: AtIdentifier;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * 新しいタイムスタンプを生成する
 * 現在時刻から少し遅延させて、確実に異なるタイムスタンプになるようにする
 * @returns 新しいDateオブジェクト
 */
function createNewTimestamp(): Date {
  const now = new Date();
  // 10ミリ秒遅延させる
  now.setMilliseconds(now.getMilliseconds() + 10);
  return now;
}

/**
 * ユーザーエンティティを作成する
 * @param params ユーザーエンティティの作成に必要なパラメータ
 * @returns ユーザーエンティティ
 */
export function createUser(params: CreateUserParams): User {
  const now = new Date();
  
  // 必須パラメータのバリデーション
  if (!params.id) {
    throw new Error("ユーザーIDは必須です");
  }
  
  // 不変オブジェクトとして返す
  return Object.freeze({
    id: params.id,
    username: params.username,
    email: params.email,
    atIdentifier: params.atIdentifier,
    createdAt: params.createdAt || now,
    updatedAt: params.updatedAt || now,
    
    updateUsername(username: Username): User {
      return createUser({
        ...this,
        username,
        updatedAt: createNewTimestamp()
      });
    },
    
    updateEmail(email: Email): User {
      return createUser({
        ...this,
        email,
        updatedAt: createNewTimestamp()
      });
    },
    
    updateAtIdentifier(atIdentifier: AtIdentifier): User {
      return createUser({
        ...this,
        atIdentifier,
        updatedAt: createNewTimestamp()
      });
    }
  });
} 