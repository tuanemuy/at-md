import type { User } from "@/domain/account/models";
import { userSchema } from "@/domain/account/models";
import type {
  CreateUser,
  UpdateUser,
  UserRepository,
} from "@/domain/account/repositories";
import { RepositoryError, RepositoryErrorCode } from "@/domain/types/error";
import { type Result, err, ok } from "@/lib/result";
import { eq } from "drizzle-orm";
import {
  type PgDatabase,
  codeToRepositoryErrorCode,
  isDatabaseError,
} from "../../client";
import { profiles, users } from "../../schema/account";

/**
 * UserRepositoryの実装
 */
export class DrizzleUserRepository implements UserRepository {
  constructor(private readonly db: PgDatabase) {}

  /**
   * ユーザーを作成する
   */
  async create(user: CreateUser): Promise<Result<User, RepositoryError>> {
    try {
      const result = await this.db.transaction(async (tx) => {
        const [savedUser] = await tx.insert(users).values(user).returning();

        if (!savedUser) {
          throw new Error("Failed to save user");
        }

        const [savedProfile] = await tx
          .insert(profiles)
          .values({
            userId: savedUser.id,
            ...user.profile,
          })
          .returning();

        if (!savedProfile) {
          throw new Error("Failed to save profile");
        }

        const parsed = userSchema.safeParse({
          ...savedUser,
          profile: savedProfile,
        });

        if (!parsed.success) {
          throw new Error("Failed to parse user data");
        }

        return parsed.data;
      });

      return ok(result);
    } catch (error) {
      const code = isDatabaseError(error) ? error.code : undefined;
      return err(
        new RepositoryError(
          codeToRepositoryErrorCode(code),
          "Failed to create user",
          error,
        ),
      );
    }
  }

  /**
   * ユーザーを更新する
   */
  async update(user: UpdateUser): Promise<Result<User, RepositoryError>> {
    try {
      const result = await this.db.transaction(async (tx) => {
        const [updatedUser] = await tx
          .update(users)
          .set(user)
          .where(eq(users.id, user.id))
          .returning();

        if (!updatedUser) {
          throw new Error("Failed to update user");
        }

        const [updatedProfile] = await tx
          .update(profiles)
          .set(user.profile)
          .where(eq(profiles.userId, user.id))
          .returning();

        if (!updatedProfile) {
          throw new Error("Failed to update profile");
        }

        return {
          ...updatedUser,
          profile: updatedProfile,
        };
      });

      return ok(result);
    } catch (error) {
      const code = isDatabaseError(error) ? error.code : undefined;
      return err(
        new RepositoryError(
          codeToRepositoryErrorCode(code),
          "Failed to update user",
          error,
        ),
      );
    }
  }

  /**
   * 指定したIDのユーザーを取得する
   */
  async findById(id: string): Promise<Result<User, RepositoryError>> {
    try {
      const result = await this.db.transaction(async (tx) => {
        const [user] = await tx
          .select()
          .from(users)
          .where(eq(users.id, id))
          .limit(1);

        if (!user) return null;

        const [profile] = await tx
          .select()
          .from(profiles)
          .where(eq(profiles.userId, user.id))
          .limit(1);

        if (!profile) return null;

        return {
          ...user,
          profile,
        };
      });

      if (!result) {
        return err(
          new RepositoryError(RepositoryErrorCode.NOT_FOUND, "User not found"),
        );
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
  async findByDid(did: string): Promise<Result<User, RepositoryError>> {
    try {
      const [user] = await this.db
        .select({
          user: users,
          profile: profiles,
        })
        .from(users)
        .innerJoin(profiles, eq(users.id, profiles.userId))
        .where(eq(users.did, did))
        .limit(1);

      if (!user) {
        return err(
          new RepositoryError(RepositoryErrorCode.NOT_FOUND, "User not found"),
        );
      }

      return ok({
        ...user.user,
        profile: user.profile,
      });
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
