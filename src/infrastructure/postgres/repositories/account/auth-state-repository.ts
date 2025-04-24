import { authStateSchema } from "@/domain/account/models/auth-state";
import type {
  AuthStateRepository,
  CreateAuthState,
} from "@/domain/account/repositories";
import { RepositoryError, RepositoryErrorCode } from "@/domain/types/error";
import { validate } from "@/domain/types/validation";
import { ResultAsync, err, ok } from "@/lib/result";
import { eq } from "drizzle-orm";
import { type PgDatabase, mapRepositoryError } from "../../client";
import { authStates } from "../../schema/account";

/**
 * AuthStateRepositoryの実装
 */
export class DrizzleAuthStateRepository implements AuthStateRepository {
  constructor(private readonly db: PgDatabase) {}

  /**
   * AuthStateを作成する
   */
  create(authState: CreateAuthState) {
    return ResultAsync.fromPromise(
      this.db
        .insert(authStates)
        .values(authState)
        .onConflictDoUpdate({
          target: authStates.key,
          set: { state: authState.state },
        })
        .returning(),
      mapRepositoryError,
    )
      .andThen(([authState]) =>
        authState
          ? ok(authState)
          : err(
              new RepositoryError(
                RepositoryErrorCode.NOT_FOUND,
                "Failed to create auth state",
              ),
            ),
      )
      .andThen((authState) =>
        validate(authStateSchema, authState).mapErr(
          (error) =>
            new RepositoryError(
              RepositoryErrorCode.DATA_ERROR,
              "Invalid auth state",
              error,
            ),
        ),
      );
  }

  /**
   * 指定したキーのAuthStateを取得する
   */
  findByKey(key: string) {
    return ResultAsync.fromPromise(
      this.db.select().from(authStates).where(eq(authStates.key, key)).limit(1),
      mapRepositoryError,
    )
      .andThen(([authState]) =>
        authState
          ? ok(authState)
          : err(
              new RepositoryError(
                RepositoryErrorCode.NOT_FOUND,
                "Auth state not found",
              ),
            ),
      )
      .andThen((authState) =>
        validate(authStateSchema, authState).mapErr(
          (error) =>
            new RepositoryError(
              RepositoryErrorCode.DATA_ERROR,
              "Invalid auth state",
              error,
            ),
        ),
      );
  }

  /**
   * 指定したキーのAuthStateを削除する
   */
  deleteByKey(key: string) {
    return ResultAsync.fromPromise(
      this.db.delete(authStates).where(eq(authStates.key, key)).returning(),
      mapRepositoryError,
    ).map(() => {});
  }
}
