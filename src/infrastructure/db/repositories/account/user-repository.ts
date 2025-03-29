import { userSchema } from "@/domain/account/models";
import type {
  CreateUser,
  UpdateUser,
  UserRepository,
} from "@/domain/account/repositories";
import { RepositoryError, RepositoryErrorCode } from "@/domain/types/error";
import { ResultAsync, err, ok } from "@/lib/result";
import { eq } from "drizzle-orm";
import { type PgDatabase, mapRepositoryError } from "../../client";
import { profiles, users } from "../../schema/account";

/**
 * UserRepositoryの実装
 */
export class DrizzleUserRepository implements UserRepository {
  constructor(private readonly db: PgDatabase) {}

  /**
   * ユーザーを作成する
   */
  create(user: CreateUser) {
    return ResultAsync.fromPromise(
      this.db.transaction(async (tx) => {
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

        return userSchema.parse({
          ...savedUser,
          profile: savedProfile,
        });
      }),
      mapRepositoryError,
    );
  }

  /**
   * ユーザーを更新する
   */
  update(user: UpdateUser) {
    return ResultAsync.fromPromise(
      this.db.transaction(async (tx) => {
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

        return userSchema.parse({
          ...updatedUser,
          profile: updatedProfile,
        });
      }),
      mapRepositoryError,
    );
  }

  /**
   * 指定したIDのユーザーを取得する
   */
  findById(id: string) {
    return ResultAsync.fromPromise(
      this.db
        .select({
          user: users,
          profile: profiles,
        })
        .from(users)
        .innerJoin(profiles, eq(users.id, profiles.userId))
        .where(eq(users.id, id))
        .limit(1),
      mapRepositoryError,
    ).andThen(([user]) =>
      user
        ? ok({
            ...user.user,
            profile: user.profile,
          })
        : err(
            new RepositoryError(
              RepositoryErrorCode.NOT_FOUND,
              "User not found",
            ),
          ),
    );
  }

  /**
   * 指定したDIDのユーザーを取得する
   */
  findByDid(did: string) {
    return ResultAsync.fromPromise(
      this.db
        .select({
          user: users,
          profile: profiles,
        })
        .from(users)
        .innerJoin(profiles, eq(users.id, profiles.userId))
        .where(eq(users.did, did))
        .limit(1),
      mapRepositoryError,
    ).andThen(([user]) =>
      user
        ? ok({
            ...user.user,
            profile: user.profile,
          })
        : err(
            new RepositoryError(
              RepositoryErrorCode.NOT_FOUND,
              "User not found",
            ),
          ),
    );
  }

  /**
   * 指定したIDのユーザーを削除する
   */
  delete(id: string) {
    return ResultAsync.fromPromise(
      this.db.delete(users).where(eq(users.id, id)),
      mapRepositoryError,
    ).map(() => {});
  }
}
