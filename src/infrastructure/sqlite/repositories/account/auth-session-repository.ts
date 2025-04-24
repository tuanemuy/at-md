import { authSessionSchema } from "@/domain/account/models/auth-session";
import type {
  AuthSessionRepository,
  CreateAuthSession,
} from "@/domain/account/repositories";
import { RepositoryError, RepositoryErrorCode } from "@/domain/types/error";
import { validate } from "@/domain/types/validation";
import { ResultAsync, err, ok } from "@/lib/result";
import { eq } from "drizzle-orm";
import { type Database, mapRepositoryError } from "../../client";
import { authSessions } from "../../schema/account";

/**
 * AuthSessionRepositoryの実装
 */
export class DrizzleAuthSessionRepository implements AuthSessionRepository {
  constructor(private readonly db: Database) {}

  /**
   * AuthSessionを作成する
   */
  create(authSession: CreateAuthSession) {
    return ResultAsync.fromPromise(
      this.db
        .insert(authSessions)
        .values(authSession)
        .onConflictDoUpdate({
          target: authSessions.key,
          set: { session: authSession.session },
        })
        .returning(),
      mapRepositoryError,
    )
      .andThen(([authSession]) =>
        authSession
          ? ok(authSession)
          : err(
              new RepositoryError(
                RepositoryErrorCode.NOT_FOUND,
                "Failed to create auth session",
              ),
            ),
      )
      .andThen((authSession) =>
        validate(authSessionSchema, authSession).mapErr(
          (error) =>
            new RepositoryError(
              RepositoryErrorCode.DATA_ERROR,
              "Invalid auth session",
              error,
            ),
        ),
      );
  }

  /**
   * 指定したキーのAuthSessionを取得する
   */
  findByKey(key: string) {
    return ResultAsync.fromPromise(
      this.db
        .select()
        .from(authSessions)
        .where(eq(authSessions.key, key))
        .limit(1),
      mapRepositoryError,
    )
      .andThen(([authSession]) =>
        authSession
          ? ok(authSession)
          : err(
              new RepositoryError(
                RepositoryErrorCode.NOT_FOUND,
                "Auth session not found",
              ),
            ),
      )
      .andThen((authSession) =>
        validate(authSessionSchema, authSession).mapErr(
          (error) =>
            new RepositoryError(
              RepositoryErrorCode.DATA_ERROR,
              "Invalid auth session",
              error,
            ),
        ),
      );
  }

  /**
   * 指定したキーのAuthSessionを削除する
   */
  deleteByKey(key: string) {
    return ResultAsync.fromPromise(
      this.db.delete(authSessions).where(eq(authSessions.key, key)),
      mapRepositoryError,
    ).map(() => {});
  }
}
