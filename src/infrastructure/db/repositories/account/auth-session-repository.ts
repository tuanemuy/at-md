import type { AuthSession } from "@/domain/account/models";
import { authSessionSchema } from "@/domain/account/models";
import type {
  AuthSessionRepository,
  CreateAuthSession,
} from "@/domain/account/repositories";
import { RepositoryError, RepositoryErrorCode } from "@/domain/types/error";
import { type Result, err, ok } from "@/lib/result";
import { eq } from "drizzle-orm";
import {
  type PgDatabase,
  codeToRepositoryErrorCode,
  isDatabaseError,
} from "../../client";
import { authSessions } from "../../schema/account";

/**
 * AuthSessionRepositoryの実装
 */
export class DrizzleAuthSessionRepository implements AuthSessionRepository {
  constructor(private readonly db: PgDatabase) {}

  /**
   * AuthSessionを作成する
   */
  async create(
    authSession: CreateAuthSession,
  ): Promise<Result<AuthSession, RepositoryError>> {
    try {
      const [savedAuthSession] = await this.db
        .insert(authSessions)
        .values(authSession)
        .onConflictDoUpdate({
          target: authSessions.key,
          set: { session: authSession.session },
        })
        .returning();

      if (!savedAuthSession) {
        return err(
          new RepositoryError(
            RepositoryErrorCode.UNKNOWN_ERROR,
            "Failed to create auth session",
          ),
        );
      }

      return ok(savedAuthSession);
    } catch (error) {
      const code = isDatabaseError(error) ? error.code : undefined;
      return err(
        new RepositoryError(
          codeToRepositoryErrorCode(code),
          "Failed to create auth session",
          error,
        ),
      );
    }
  }

  /**
   * 指定したキーのAuthSessionを取得する
   */
  async findByKey(key: string): Promise<Result<AuthSession, RepositoryError>> {
    try {
      const [authSession] = await this.db
        .select()
        .from(authSessions)
        .where(eq(authSessions.key, key))
        .limit(1);

      if (!authSession) {
        return err(
          new RepositoryError(
            RepositoryErrorCode.NOT_FOUND,
            "Auth session not found",
          ),
        );
      }

      return ok(authSession);
    } catch (error) {
      const code = isDatabaseError(error) ? error.code : undefined;
      return err(
        new RepositoryError(
          codeToRepositoryErrorCode(code),
          "Failed to find auth session by key",
          error,
        ),
      );
    }
  }

  /**
   * 指定したキーのAuthSessionを削除する
   */
  async deleteByKey(key: string): Promise<Result<void, RepositoryError>> {
    try {
      await this.db.delete(authSessions).where(eq(authSessions.key, key));
      return ok(undefined);
    } catch (error) {
      const code = isDatabaseError(error) ? error.code : undefined;
      return err(
        new RepositoryError(
          codeToRepositoryErrorCode(code),
          "Failed to delete auth session",
          error,
        ),
      );
    }
  }
}
