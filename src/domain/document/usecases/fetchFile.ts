import type { Result } from "neverthrow";
import type { SyncError } from "../models/errors";
import type { GitHubRepo } from "../models/githubRepo";
import type { SyncService } from "../services/sync";

/**
 * ファイル取得のユースケース
 */
export class FetchFileUseCase {
  constructor(private readonly syncService: SyncService) {}

  /**
   * GitHubリポジトリからファイルを取得する
   * @param gitHubRepo GitHubリポジトリ
   * @param path ファイルパス
   * @returns ファイルの内容
   */
  async execute(
    gitHubRepo: GitHubRepo,
    path: string,
  ): Promise<Result<string, SyncError>> {
    return await this.syncService.fetchFile(gitHubRepo, path);
  }
} 