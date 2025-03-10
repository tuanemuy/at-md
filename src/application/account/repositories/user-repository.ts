/**
 * ユーザーリポジトリインターフェース
 * ユーザーの永続化を担当するリポジトリのインターフェース
 */

import { UserRepository as CoreUserRepository, TransactionContext } from "../deps.ts";

/**
 * アプリケーション層のユーザーリポジトリインターフェース
 * コアレイヤーのユーザーリポジトリインターフェースを拡張します
 */
export type UserRepository = CoreUserRepository;

// 型の再エクスポート
export type { TransactionContext }; 