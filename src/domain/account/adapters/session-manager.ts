/**
 * セッション管理アダプターのインターフェース
 */
import type { Result } from "neverthrow";
import type { Session } from "../models";
import type { AccountError } from "../models/errors";

/**
 * セッション管理アダプターのインターフェース
 */
export interface SessionManager {
  /**
   * セッションを作成する
   */
  createSession(session: Session): Promise<Result<void, AccountError>>;

  /**
   * セッションを検証する
   */
  validateSession(token: string): Promise<Result<Session, AccountError>>;

  /**
   * セッションを更新する
   */
  refreshSession(token: string): Promise<Result<Session, AccountError>>;

  /**
   * セッションを無効化する
   */
  revokeSession(token: string): Promise<Result<void, AccountError>>;
}
