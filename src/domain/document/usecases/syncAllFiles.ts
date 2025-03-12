import type { ID } from "@/domain/shared/models/id";
import type { Result } from "neverthrow";
import type { Document } from "../models/document";
import type { SyncError } from "../models/errors";
import type { GitHubRepo } from "../models/githubRepo";
import type { SyncService } from "../services/sync";

/**
 * すべてのファイル同期のユースケース
 */
export class SyncAllFilesUseCase {
  constructor(private readonly syncService: SyncService) {}

  /**
   * GitHubリポジトリからすべてのファイルを同期する
   * @param gitHubRepo GitHubリポジトリ
   * @param userId ユーザーID
   * @returns 同期された文書の配列
   */
  async execute(
    gitHubRepo: GitHubRepo,
    userId: ID,
  ): Promise<Result<Document[], SyncError>> {
    return await this.syncService.syncAllFiles(gitHubRepo, userId);
  }
}
