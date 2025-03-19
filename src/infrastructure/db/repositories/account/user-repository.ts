import { and, eq } from "drizzle-orm";
import { type Result, err, ok } from "@/lib/result";
import { v7 as uuidv7 } from "uuid";
import type { User } from "@/domain/account/models";
import type { UserRepository } from "@/domain/account/repositories";
import { RepositoryError, RepositoryErrorCode } from "@/domain/types/error";
import {
  type PgDatabase,
  isDatabaseError,
  codeToRepositoryErrorCode,
} from "../../client";
import { profiles, users } from "../../schema/account";

/**
 * UserRepositoryの実装
 */
export class DrizzleUserRepository implements UserRepository {
  constructor(private readonly db: PgDatabase) {}

  /**
   * ユーザーを保存する
   * 新規作成または更新を行う
   */
  async save(user: User): Promise<Result<User, RepositoryError>> {
    try {
      const result = await this.db.transaction(async (tx) => {
        const [savedUser] = await tx
          .insert(users)
          .values({
            id: user.id,
            did: user.did,
          })
          .onConflictDoUpdate({
            target: users.id,
            set: {
              did: user.did,
            },
          })
          .returning();

        if (!savedUser) {
          throw new Error("Failed to save user");
        }

        const [savedProfile] = await tx
          .insert(profiles)
          .values({
            userId: savedUser.id,
            ...user.profile,
          })
          .onConflictDoUpdate({
            target: profiles.userId,
            set: { ...user.profile },
          })
          .returning();

        if (!savedProfile) {
          throw new Error("Failed to save profile");
        }

        return { ...savedUser, profile: savedProfile };
      });

      return ok(result);
    } catch (error) {
      const code = isDatabaseError(error) ? error.code : undefined;
      return err(
        new RepositoryError(
          codeToRepositoryErrorCode(code),
          "Failed to save user",
          error,
        ),
      );
    }
  }

  /**
   * 指定したIDのユーザーを取得する
   */
  async findById(id: string): Promise<Result<User | null, RepositoryError>> {
    try {
      const result = await this.db.transaction(async (tx) => {
        const userResult = await tx
          .select()
          .from(users)
          .where(eq(users.id, id))
          .limit(1);

        if (userResult.length === 0) return null;

        const profileResult = await tx
          .select()
          .from(profiles)
          .where(eq(profiles.userId, userResult[0].id))
          .limit(1);

        if (profileResult.length === 0) return null;

        return { ...userResult[0], profile: profileResult[0] };
      });

      if (result === null) {
        return ok(null);
      }

      return ok(result);
    } catch (error) {
      const code = isDatabaseError(error) ? error.code : undefined;
      return err(
        new RepositoryError(
          codeToRepositoryErrorCode(code),
          "Failed to find user by ID",
          error,
        ),
      );
    }
  }

  /**
   * 指定したDIDのユーザーを取得する
   */
  async findByDid(did: string): Promise<Result<User | null, RepositoryError>> {
    try {
      const result = await this.db.transaction(async (tx) => {
        const userResult = await tx
          .select()
          .from(users)
          .where(eq(users.did, did))
          .limit(1);

        if (userResult.length === 0) return null;

        const profileResult = await tx
          .select()
          .from(profiles)
          .where(eq(profiles.userId, userResult[0].id))
          .limit(1);

        if (profileResult.length === 0) return null;

        return { ...userResult[0], profile: profileResult[0] };
      });

      if (result === null) {
        return ok(null);
      }

      return ok(result);
    } catch (error) {
      const code = isDatabaseError(error) ? error.code : undefined;
      return err(
        new RepositoryError(
          codeToRepositoryErrorCode(code),
          "Failed to find user by DID",
          error,
        ),
      );
    }
  }

  /**
   * 指定したIDのユーザーを削除する
   */
  async delete(id: string): Promise<Result<void, RepositoryError>> {
    try {
      await this.db.delete(users).where(eq(users.id, id));
      return ok(undefined);
    } catch (error) {
      const code = isDatabaseError(error) ? error.code : undefined;
      return err(
        new RepositoryError(
          codeToRepositoryErrorCode(code),
          "Failed to delete user",
          error,
        ),
      );
    }
  }
}
