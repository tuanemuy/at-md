import { Repository, createRepository } from "../entities/repository.ts";

/**
 * リポジトリ集約を表すインターフェース
 * リポジトリエンティティとそれに関連する操作をカプセル化する
 */
export interface RepositoryAggregate {
  /** リポジトリエンティティ */
  readonly repository: Repository;

  /**
   * リポジトリ名を更新する
   * @param name 新しいリポジトリ名
   * @returns 新しいRepositoryAggregateインスタンス
   */
  updateName(name: string): RepositoryAggregate;

  /**
   * デフォルトブランチを変更する
   * @param defaultBranch 新しいデフォルトブランチ
   * @returns 新しいRepositoryAggregateインスタンス
   */
  changeDefaultBranch(defaultBranch: string): RepositoryAggregate;

  /**
   * 同期を開始する
   * @returns 新しいRepositoryAggregateインスタンス
   */
  startSync(): RepositoryAggregate;

  /**
   * 同期を完了する
   * @param syncDate 同期完了日時
   * @returns 新しいRepositoryAggregateインスタンス
   */
  completeSync(syncDate: Date): RepositoryAggregate;

  /**
   * リポジトリを非アクティブにする
   * @returns 新しいRepositoryAggregateインスタンス
   */
  deactivate(): RepositoryAggregate;

  /**
   * リポジトリをアクティブにする
   * @returns 新しいRepositoryAggregateインスタンス
   */
  activate(): RepositoryAggregate;
}

/**
 * RepositoryAggregateを作成する
 * @param repository リポジトリエンティティ
 * @returns 不変なRepositoryAggregateオブジェクト
 */
export function createRepositoryAggregate(repository: Repository): RepositoryAggregate {
  const aggregate: RepositoryAggregate = {
    repository,

    updateName(name: string): RepositoryAggregate {
      const updatedRepository = createRepository({
        ...this.repository,
        name,
        updatedAt: new Date()
      });

      return createRepositoryAggregate(updatedRepository);
    },

    changeDefaultBranch(defaultBranch: string): RepositoryAggregate {
      const updatedRepository = this.repository.changeDefaultBranch(defaultBranch);
      return createRepositoryAggregate(updatedRepository);
    },

    startSync(): RepositoryAggregate {
      const updatedRepository = this.repository.changeStatus("syncing");
      return createRepositoryAggregate(updatedRepository);
    },

    completeSync(syncDate: Date): RepositoryAggregate {
      // 最終同期日時を更新
      const repositoryWithUpdatedSyncDate = this.repository.updateLastSyncedAt(syncDate);
      
      // ステータスをアクティブに変更
      const updatedRepository = repositoryWithUpdatedSyncDate.changeStatus("active");
      
      return createRepositoryAggregate(updatedRepository);
    },

    deactivate(): RepositoryAggregate {
      const updatedRepository = this.repository.changeStatus("inactive");
      return createRepositoryAggregate(updatedRepository);
    },

    activate(): RepositoryAggregate {
      const updatedRepository = this.repository.changeStatus("active");
      return createRepositoryAggregate(updatedRepository);
    }
  };

  return Object.freeze(aggregate);
} 