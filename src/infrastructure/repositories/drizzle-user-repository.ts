/**
 * Drizzle ORMを使用したユーザーリポジトリの実装
 */

import { eq } from "npm:drizzle-orm";
import { Result, ok, err, createUserAggregate } from "./deps.ts";

import { 
  User, 
  UserAggregate, 
  createUser,
  Username,
  Email,
  AtIdentifier,
  createUsername,
  createEmail,
  createAtIdentifier
} from "../../core/account/mod.ts";
import { DomainError } from "../../core/errors/mod.ts";
import { 
  UserRepository,
  TransactionContext,
  PostgresUnitOfWork,
  generateId
} from "./deps.ts";
import * as userSchema from "../database/schema/user.ts";
import type { Database } from "../database/schema/mod.ts";
import { pool } from "../database/db.ts";
import { PostgresTransactionContext } from "../database/postgres-unit-of-work.ts";

/**
 * Drizzle ORMを使用したユーザーリポジトリの実装
 */
export class DrizzleUserRepository implements UserRepository {
  private db: Database;

  /**
   * コンストラクタ
   * @param db データベース接続
   */
  constructor(db: Database) {
    this.db = db;
  }

  /**
   * IDによってユーザーを検索する
   * @param id ユーザーID
   * @returns ユーザー集約、存在しない場合はnull
   */
  async findById(id: string): Promise<UserAggregate | null> {
    const result = await this.db.select()
      .from(userSchema.users)
      .where(eq(userSchema.users.id, id))
      .limit(1);
    
    if (result.length === 0) {
      return null;
    }
    
    const userData = result[0];
    
    // ユーザー集約を作成して返す
    return this.createUserAggregateFromData({
      id: userData.id,
      username: userData.username,
      email: userData.email,
      atIdentifier: userData.atIdentifier,
      did: userData.did,
      passwordHash: userData.passwordHash,
      createdAt: userData.createdAt,
      updatedAt: userData.updatedAt
    });
  }
  
  /**
   * ユーザー名によってユーザーを検索する
   * @param username ユーザー名
   * @returns ユーザー集約、存在しない場合はnull
   */
  async findByUsername(username: string): Promise<UserAggregate | null> {
    const result = await this.db.select()
      .from(userSchema.users)
      .where(eq(userSchema.users.username, username))
      .limit(1);
    
    if (result.length === 0) {
      return null;
    }
    
    const userData = result[0];
    
    // ユーザー集約を作成して返す
    const aggregateResult = this.createUserAggregateFromData(userData);
    return aggregateResult ? aggregateResult : null;
  }
  
  /**
   * メールアドレスによってユーザーを検索する
   * @param email メールアドレス
   * @returns ユーザー集約、存在しない場合はnull
   */
  async findByEmail(email: string): Promise<UserAggregate | null> {
    const result = await this.db.select()
      .from(userSchema.users)
      .where(eq(userSchema.users.email, email))
      .limit(1);
    
    if (result.length === 0) {
      return null;
    }
    
    const userData = result[0];
    
    // ユーザー集約を作成して返す
    const aggregateResult = this.createUserAggregateFromData(userData);
    return aggregateResult ? aggregateResult : null;
  }
  
  /**
   * DIDによってユーザーを検索する
   * @param did DID
   * @returns ユーザー集約、存在しない場合はnull
   */
  async findByDid(did: string): Promise<UserAggregate | null> {
    const result = await this.db.select()
      .from(userSchema.users)
      .where(eq(userSchema.users.did, did))
      .limit(1);
    
    if (result.length === 0) {
      return null;
    }
    
    const userData = result[0];
    
    // ユーザー集約を作成して返す
    const aggregateResult = this.createUserAggregateFromData(userData);
    return aggregateResult ? aggregateResult : null;
  }
  
  /**
   * ハンドルによってユーザーを検索する
   * @param handle ハンドル
   * @returns ユーザー集約、存在しない場合はnull
   */
  async findByHandle(handle: string): Promise<UserAggregate | null> {
    const result = await this.db.select()
      .from(userSchema.users)
      .where(eq(userSchema.users.atIdentifier, handle))
      .limit(1);
    
    if (result.length === 0) {
      return null;
    }
    
    const userData = result[0];
    
    // ユーザー集約を作成して返す
    const aggregateResult = this.createUserAggregateFromData(userData);
    return aggregateResult ? aggregateResult : null;
  }
  
  /**
   * ユーザーを保存する
   * @param userAggregate ユーザー集約
   * @returns 保存されたユーザー集約
   */
  async save(userAggregate: UserAggregate): Promise<UserAggregate> {
    const user = userAggregate.user;
    const isNew = !(await this.findById(user.id));
    
    const userData = {
      id: user.id,
      username: user.username.value,
      email: user.email.value,
      atIdentifier: user.atIdentifier.handle || null,
      did: user.atIdentifier.value,
      passwordHash: user.passwordHash || null,
      createdAt: user.createdAt,
      updatedAt: new Date()
    };
    
    await this.db.insert(userSchema.users)
      .values({
        id: userData.id,
        username: userData.username,
        email: userData.email,
        atIdentifier: userData.atIdentifier,
        did: userData.did,
        passwordHash: userData.passwordHash,
        createdAt: userData.createdAt,
        updatedAt: userData.updatedAt
      })
      .onConflictDoUpdate({
        target: userSchema.users.id,
        set: {
          username: userData.username,
          email: userData.email,
          atIdentifier: userData.atIdentifier,
          did: userData.did,
          passwordHash: userData.passwordHash,
          updatedAt: userData.updatedAt
        }
      });
    
    return userAggregate;
  }
  
  /**
   * トランザクション内でユーザーを保存する
   * @param userAggregate ユーザー集約
   * @param context トランザクションコンテキスト
   * @returns 保存されたユーザー集約の結果
   */
  async saveWithTransaction(
    userAggregate: UserAggregate, 
    context: TransactionContext
  ): Promise<Result<UserAggregate, DomainError>> {
    try {
      const postgresContext = context as PostgresTransactionContext;
      const user = userAggregate.user;
      
      const userData = {
        id: user.id,
        username: user.username.value,
        email: user.email.value,
        atIdentifier: user.atIdentifier.handle || null,
        did: user.atIdentifier.value,
        passwordHash: user.passwordHash || null,
        createdAt: user.createdAt,
        updatedAt: new Date()
      };
      
      // ユーザーが存在するか確認
      const existingUser = await postgresContext.client.query(
        `SELECT id FROM users WHERE id = $1`,
        [userData.id]
      );
      
      if (existingUser.rowCount && existingUser.rowCount > 0) {
        // 更新
        await postgresContext.client.query(
          `UPDATE users 
           SET username = $1, email = $2, at_identifier = $3, did = $4, 
               password_hash = $5, updated_at = $6
           WHERE id = $7`,
          [
            userData.username,
            userData.email,
            userData.atIdentifier,
            userData.did,
            userData.passwordHash,
            userData.updatedAt,
            userData.id
          ]
        );
      } else {
        // 挿入
        await postgresContext.client.query(
          `INSERT INTO users 
           (id, username, email, at_identifier, did, password_hash, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
          [
            userData.id,
            userData.username,
            userData.email,
            userData.atIdentifier,
            userData.did,
            userData.passwordHash,
            userData.createdAt,
            userData.updatedAt
          ]
        );
      }
      
      return ok(userAggregate);
    } catch (error) {
      console.error("ユーザー保存エラー:", error);
      return err(new DomainError("ユーザーの保存に失敗しました: " + (error instanceof Error ? error.message : String(error))));
    }
  }
  
  /**
   * ユーザーを削除する
   * @param id ユーザーID
   * @returns 削除に成功した場合はtrue、それ以外はfalse
   */
  async delete(id: string): Promise<boolean> {
    const result = await this.db.delete(userSchema.users)
      .where(eq(userSchema.users.id, id));
    
    return result.rowCount ? result.rowCount > 0 : false;
  }
  
  /**
   * トランザクション内でユーザーを削除する
   * @param id ユーザーID
   * @param context トランザクションコンテキスト
   * @returns 削除結果
   */
  async deleteWithTransaction(
    id: string, 
    context: TransactionContext
  ): Promise<Result<boolean, DomainError>> {
    try {
      const postgresContext = context as PostgresTransactionContext;
      
      // ユーザーを削除
      const result = await postgresContext.client.query(
        `DELETE FROM users WHERE id = $1`,
        [id]
      );
      
      return ok(result.rowCount ? result.rowCount > 0 : false);
    } catch (error) {
      console.error("ユーザー削除エラー:", error);
      return err(new DomainError("ユーザーの削除に失敗しました: " + (error instanceof Error ? error.message : String(error))));
    }
  }

  /**
   * ユーザーデータからユーザー集約を作成する
   * @param userData ユーザーデータ
   * @returns ユーザー集約、無効なデータの場合はnull
   */
  private createUserAggregateFromData(userData: {
    id: string;
    username: string;
    email: string;
    atIdentifier: string | null;
    did: string | null;
    passwordHash: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): UserAggregate | null {
    try {
      // ユーザー集約の作成
      return createUserAggregate({
        id: userData.id,
        username: userData.username,
        email: userData.email,
        atIdentifier: {
          did: userData.did || "",
          handle: userData.atIdentifier || undefined
        }
      });
    } catch (error) {
      console.error("ユーザー集約の作成に失敗しました:", error);
      return null;
    }
  }
} 