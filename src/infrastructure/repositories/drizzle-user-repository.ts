/**
 * Drizzleを使用したユーザーリポジトリの実装
 */

import { eq } from "npm:drizzle-orm";
import { db } from "../database/db.ts";
import { users } from "../database/schema/user.ts";
import { UserRepository } from "../../application/account/repositories/user-repository.ts";
import { UserAggregate, createUserAggregate } from "../../core/account/aggregates/user-aggregate.ts";
import { createUsername, createEmail, createAtIdentifier } from "../../core/account/value-objects/mod.ts";
import { Result, ok, err } from "../../deps.ts";
import { InfrastructureError } from "../../core/errors/base.ts";
import { TransactionContext } from "../database/unit-of-work.ts";
import { PostgresTransactionContext } from "../database/postgres-unit-of-work.ts";

/**
 * Drizzleを使用したユーザーリポジトリの実装
 */
export class DrizzleUserRepository implements UserRepository {
  /**
   * IDによるユーザー検索
   * @param id ユーザーID
   * @returns ユーザー集約またはnull
   */
  async findById(id: string): Promise<UserAggregate | null> {
    try {
      const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
      
      if (result.length === 0) {
        return null;
      }
      
      const user = result[0];
      
      return this.mapToUserAggregate(user);
    } catch (error) {
      console.error("ユーザーID検索エラー:", error);
      throw error;
    }
  }
  
  /**
   * ユーザー名によるユーザー検索
   * @param username ユーザー名
   * @returns ユーザー集約またはnull
   */
  async findByUsername(username: string): Promise<UserAggregate | null> {
    try {
      const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
      
      if (result.length === 0) {
        return null;
      }
      
      const user = result[0];
      
      return this.mapToUserAggregate(user);
    } catch (error) {
      console.error("ユーザー名検索エラー:", error);
      throw error;
    }
  }
  
  /**
   * メールアドレスによるユーザー検索
   * @param email メールアドレス
   * @returns ユーザー集約またはnull
   */
  async findByEmail(email: string): Promise<UserAggregate | null> {
    try {
      const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
      
      if (result.length === 0) {
        return null;
      }
      
      const user = result[0];
      
      return this.mapToUserAggregate(user);
    } catch (error) {
      console.error("メールアドレス検索エラー:", error);
      throw error;
    }
  }
  
  /**
   * DIDによるユーザー検索
   * @param did DID
   * @returns ユーザー集約またはnull
   */
  async findByDid(did: string): Promise<UserAggregate | null> {
    try {
      const result = await db.select().from(users).where(eq(users.atDid, did)).limit(1);
      
      if (result.length === 0) {
        return null;
      }
      
      const user = result[0];
      
      return this.mapToUserAggregate(user);
    } catch (error) {
      console.error("DID検索エラー:", error);
      throw error;
    }
  }
  
  /**
   * ハンドルによるユーザー検索
   * @param handle ハンドル
   * @returns ユーザー集約またはnull
   */
  async findByHandle(handle: string): Promise<UserAggregate | null> {
    try {
      const result = await db.select().from(users).where(eq(users.atHandle, handle)).limit(1);
      
      if (result.length === 0) {
        return null;
      }
      
      const user = result[0];
      
      return this.mapToUserAggregate(user);
    } catch (error) {
      console.error("ハンドル検索エラー:", error);
      throw error;
    }
  }
  
  /**
   * ユーザーの保存
   * @param userAggregate ユーザー集約
   * @returns 保存されたユーザー集約
   */
  async save(userAggregate: UserAggregate): Promise<UserAggregate> {
    try {
      const user = userAggregate.user;
      
      // 既存のユーザーを確認
      const existingUser = await this.findById(user.id);
      
      if (existingUser) {
        // 更新
        await db.update(users)
          .set({
            username: user.username.value,
            email: user.email.value,
            atDid: user.atIdentifier.value,
            atHandle: user.atIdentifier.handle,
            updatedAt: new Date()
          })
          .where(eq(users.id, user.id));
      } else {
        // 新規作成
        await db.insert(users).values({
          id: user.id,
          username: user.username.value,
          email: user.email.value,
          atDid: user.atIdentifier.value,
          atHandle: user.atIdentifier.handle,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        });
      }
      
      // 保存後のユーザーを取得
      const savedUser = await this.findById(user.id);
      
      if (!savedUser) {
        throw new Error(`ユーザー ${user.id} の保存に失敗しました`);
      }
      
      return savedUser;
    } catch (error) {
      console.error("ユーザー保存エラー:", error);
      throw error;
    }
  }
  
  /**
   * ユーザーの削除
   * @param id ユーザーID
   * @returns 削除が成功したかどうか
   */
  async delete(id: string): Promise<boolean> {
    try {
      const result = await db.delete(users).where(eq(users.id, id));
      
      // 削除が成功したかどうかを返す
      return result !== undefined && Object.keys(result).length > 0;
    } catch (error) {
      console.error("ユーザー削除エラー:", error);
      throw error;
    }
  }
  
  /**
   * データベースのユーザーをユーザー集約にマッピング
   * @param user データベースのユーザー
   * @returns ユーザー集約
   */
  private mapToUserAggregate(user: {
    id: string;
    username: string;
    email: string;
    atDid: string;
    atHandle: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): UserAggregate {
    return createUserAggregate({
      id: user.id,
      username: user.username,
      email: user.email,
      atIdentifier: {
        did: user.atDid,
        handle: user.atHandle ?? undefined
      },
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    });
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
  ): Promise<Result<UserAggregate, InfrastructureError>> {
    try {
      // PostgreSQLのトランザクションコンテキストにキャスト
      const pgContext = context as PostgresTransactionContext;
      if (!pgContext.client) {
        return err(new InfrastructureError("無効なトランザクションコンテキストです"));
      }

      const user = userAggregate.user;
      
      // 既存のユーザーを確認
      const existingUser = await this.findById(user.id);
      
      if (existingUser) {
        // 更新
        await pgContext.client.query(
          `UPDATE users 
           SET username = $1, email = $2, at_did = $3, at_handle = $4, updated_at = $5
           WHERE id = $6`,
          [
            user.username.value,
            user.email.value,
            user.atIdentifier.value,
            user.atIdentifier.handle,
            new Date().toISOString(),
            user.id
          ]
        );
      } else {
        // 新規作成
        await pgContext.client.query(
          `INSERT INTO users (id, username, email, at_did, at_handle, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            user.id,
            user.username.value,
            user.email.value,
            user.atIdentifier.value,
            user.atIdentifier.handle,
            user.createdAt.toISOString(),
            user.updatedAt.toISOString()
          ]
        );
      }
      
      return ok(userAggregate);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return err(new InfrastructureError(`ユーザーの保存に失敗しました: ${errorMessage}`));
    }
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
  ): Promise<Result<boolean, InfrastructureError>> {
    try {
      // PostgreSQLのトランザクションコンテキストにキャスト
      const pgContext = context as PostgresTransactionContext;
      if (!pgContext.client) {
        return err(new InfrastructureError("無効なトランザクションコンテキストです"));
      }

      // ユーザーを削除
      const result = await pgContext.client.query(
        "DELETE FROM users WHERE id = $1",
        [id]
      );
      
      const rowCount = result.rowCount || 0;
      return ok(rowCount > 0);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return err(new InfrastructureError(`ユーザーの削除に失敗しました: ${errorMessage}`));
    }
  }
} 