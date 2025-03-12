import type { ID } from "@/domain/shared/models/id";
import type { Result } from "neverthrow";
import type { Document } from "../models/document";
import type { SyncError } from "../models/errors";
import type { GitHubRepo } from "../models/githubRepo";
import type { SyncService } from "../services/sync";

/**
 * ファイル同期のユースケース
 */
export class SyncFileUseCase {
  constructor(private readonly syncService: SyncService) {}

  /**
   * GitHubリポジトリからファイルを同期する
   * @param gitHubRepo GitHubリポジトリ
   * @param path ファイルパス
   * @param userId ユーザーID
   * @returns 同期された文書
   */
  async execute(
    gitHubRepo: GitHubRepo,
    path: string,
    userId: ID,
  ): Promise<Result<Document, SyncError>> {
    return await this.syncService.syncFile(gitHubRepo, path, userId);
  }
}
