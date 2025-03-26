import type { AuthState } from "@/domain/account/models";
import { authStateSchema } from "@/domain/account/models";
import type {
  AuthStateRepository,
  CreateAuthState,
} from "@/domain/account/repositories";
import { RepositoryError, RepositoryErrorCode } from "@/domain/types/error";
import { type Result, err, ok } from "@/lib/result";
import { eq } from "drizzle-orm";
import {
  type PgDatabase,
  codeToRepositoryErrorCode,
  isDatabaseError,
} from "../../client";
import { authStates } from "../../schema/account";

/**
 * AuthStateRepositoryの実装
 */
export class DrizzleAuthStateRepository implements AuthStateRepository {
  constructor(private readonly db: PgDatabase) {}

  /**
   * AuthStateを作成する
   */
  async create(
    authState: CreateAuthState,
  ): Promise<Result<AuthState, RepositoryError>> {
    try {
      const [savedAuthState] = await this.db
        .insert(authStates)
        .values(authState)
        .onConflictDoUpdate({
          target: authStates.key,
          set: { state: authState.state },
        })
        .returning();

      if (!savedAuthState) {
        return err(
          new RepositoryError(
            RepositoryErrorCode.UNKNOWN_ERROR,
            "Failed to create auth state",
          ),
        );
      }

      return ok(savedAuthState);
    } catch (error) {
      const code = isDatabaseError(error) ? error.code : undefined;
      return err(
        new RepositoryError(
          codeToRepositoryErrorCode(code),
          "Failed to create auth state",
          error,
        ),
      );
    }
  }

  /**
   * 指定したキーのAuthStateを取得する
   */
  async findByKey(key: string): Promise<Result<AuthState, RepositoryError>> {
    try {
      const [authState] = await this.db
        .select()
        .from(authStates)
        .where(eq(authStates.key, key))
        .limit(1);

      if (!authState) {
        return err(
          new RepositoryError(
            RepositoryErrorCode.NOT_FOUND,
            "Auth state not found",
          ),
        );
      }

      return ok(authState);
    } catch (error) {
      const code = isDatabaseError(error) ? error.code : undefined;
      return err(
        new RepositoryError(
          codeToRepositoryErrorCode(code),
          "Failed to find auth state by key",
          error,
        ),
      );
    }
  }

  /**
   * 指定したキーのAuthStateを削除する
   */
  async deleteByKey(key: string): Promise<Result<void, RepositoryError>> {
    try {
      await this.db.delete(authStates).where(eq(authStates.key, key));
      return ok(undefined);
    } catch (error) {
      const code = isDatabaseError(error) ? error.code : undefined;
      return err(
        new RepositoryError(
          codeToRepositoryErrorCode(code),
          "Failed to delete auth state",
          error,
        ),
      );
    }
  }
}
