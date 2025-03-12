import type { Result } from "neverthrow";
import type { SyncError } from "../models/errors";
import type { GitHubRepo } from "../models/githubRepo";
import type { SyncService } from "../services/sync";

/**
 * ファイル一覧取得のユースケース
 */
export class FetchFilesUseCase {
  constructor(private readonly syncService: SyncService) {}

  /**
   * GitHubリポジトリからファイル一覧を取得する
   * @param gitHubRepo GitHubリポジトリ
   * @returns ファイルパスの配列
   */
  async execute(
    gitHubRepo: GitHubRepo,
  ): Promise<Result<string[], SyncError>> {
    return await this.syncService.fetchFiles(gitHubRepo);
  }
} 