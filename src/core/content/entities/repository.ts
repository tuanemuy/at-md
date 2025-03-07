/**
 * リポジトリの状態を表す型
 */
export type RepositoryStatus = "active" | "inactive" | "syncing";

/**
 * リポジトリエンティティを表すインターフェース
 */
export interface Repository {
  /** リポジトリID */
  readonly id: string;
  /** ユーザーID */
  readonly userId: string;
  /** リポジトリ名 */
  readonly name: string;
  /** オーナー名 */
  readonly owner: string;
  /** デフォルトブランチ */
  readonly defaultBranch: string;
  /** 最終同期日時 */
  readonly lastSyncedAt: Date;
  /** ステータス */
  readonly status: RepositoryStatus;
  /** 作成日時 */
  readonly createdAt: Date;
  /** 更新日時 */
  readonly updatedAt: Date;

  /**
   * ステータスを変更する
   * @param status 新しいステータス
   * @returns 新しいRepositoryインスタンス
   */
  changeStatus(status: RepositoryStatus): Repository;

  /**
   * 最終同期日時を更新する
   * @param lastSyncedAt 新しい最終同期日時
   * @returns 新しいRepositoryインスタンス
   */
  updateLastSyncedAt(lastSyncedAt: Date): Repository;

  /**
   * デフォルトブランチを変更する
   * @param defaultBranch 新しいデフォルトブランチ
   * @returns 新しいRepositoryインスタンス
   */
  changeDefaultBranch(defaultBranch: string): Repository;
}

/**
 * Repositoryを作成するための入力パラメータ
 */
export interface RepositoryParams {
  id: string;
  userId: string;
  name: string;
  owner: string;
  defaultBranch: string;
  lastSyncedAt: Date;
  status: RepositoryStatus;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Repositoryを作成する
 * @param params Repositoryのパラメータ
 * @returns 不変なRepositoryオブジェクト
 * @throws IDが空、または無効なステータスの場合はエラー
 */
export function createRepository(params: RepositoryParams): Repository {
  if (!params.id) {
    throw new Error("リポジトリIDは必須です");
  }

  const validStatuses: RepositoryStatus[] = ["active", "inactive", "syncing"];
  if (!validStatuses.includes(params.status)) {
    throw new Error("無効なステータスです");
  }

  const repository: Repository = {
    id: params.id,
    userId: params.userId,
    name: params.name,
    owner: params.owner,
    defaultBranch: params.defaultBranch,
    lastSyncedAt: params.lastSyncedAt,
    status: params.status,
    createdAt: params.createdAt,
    updatedAt: params.updatedAt,

    changeStatus(status: RepositoryStatus): Repository {
      return createRepository({
        ...this,
        status,
        updatedAt: new Date()
      });
    },

    updateLastSyncedAt(lastSyncedAt: Date): Repository {
      return createRepository({
        ...this,
        lastSyncedAt,
        updatedAt: new Date()
      });
    },

    changeDefaultBranch(defaultBranch: string): Repository {
      return createRepository({
        ...this,
        defaultBranch,
        updatedAt: new Date()
      });
    }
  };

  return Object.freeze(repository);
} 