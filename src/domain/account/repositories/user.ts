import type { Result } from "neverthrow";
import type { ID } from "@/domain/shared/models/id";
import type { User, GitHubConnection } from "../models/user";
import type { RepositoryError } from "@/domain/shared/models/common";

/**
 * ユーザーリポジトリのインターフェース
 */
export interface UserRepository {
  /**
   * IDによるユーザー検索
   * @param id ユーザーID
   * @returns ユーザーまたはnull
   */
  findById(id: ID): Promise<Result<User | null, RepositoryError>>;

  /**
   * DIDによるユーザー検索
   * @param did DID (Decentralized Identifier)
   * @returns ユーザーまたはnull
   */
  findByDid(did: string): Promise<Result<User | null, RepositoryError>>;

  /**
   * ユーザーの保存
   * @param user ユーザーオブジェクト
   * @returns 保存されたユーザー
   */
  save(user: User): Promise<Result<User, RepositoryError>>;

  /**
   * GitHub連携情報の追加
   * @param userId ユーザーID
   * @param connection GitHub連携情報
   * @returns 保存されたGitHub連携情報
   */
  addGitHubConnection(
    userId: ID,
    connection: GitHubConnection,
  ): Promise<Result<GitHubConnection, RepositoryError>>;

  /**
   * ユーザーの削除
   * @param id ユーザーID
   * @returns void
   */
  delete(id: ID): Promise<Result<void, RepositoryError>>;
}
