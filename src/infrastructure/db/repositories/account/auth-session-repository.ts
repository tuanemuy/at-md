import type {
  AuthSessionRepository,
  CreateAuthSession,
} from "@/domain/account/repositories";
import { RepositoryError, RepositoryErrorCode } from "@/domain/types/error";
import { ResultAsync, err, ok } from "@/lib/result";
import { eq } from "drizzle-orm";
import { type PgDatabase, mapRepositoryError } from "../../client";
import { authSessions } from "../../schema/account";

/**
 * AuthSessionRepositoryの実装
 */
export class DrizzleAuthSessionRepository implements AuthSessionRepository {
  constructor(private readonly db: PgDatabase) {}

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
    ).andThen(([savedAuthSession]) =>
      savedAuthSession
        ? ok(savedAuthSession)
        : err(
            new RepositoryError(
              RepositoryErrorCode.NOT_FOUND,
              "Failed to create auth session",
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
    ).andThen(([authSession]) =>
      authSession
        ? ok(authSession)
        : err(
            new RepositoryError(
              RepositoryErrorCode.NOT_FOUND,
              "Auth session not found",
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
