import type { Result } from "neverthrow";
import type { ID } from "@/domain/shared/models/id";
import type { Document } from "../models/document";
import type { GitHubRepo } from "../models/githubRepo";
import type { SyncError } from "../models/errors";

/**
 * 同期サービスのインターフェース
 */
export interface SyncService {
  /**
   * GitHubリポジトリからファイルを取得する
   * @param gitHubRepo GitHubリポジトリ
   * @param path ファイルパス
   * @returns ファイルの内容
   */
  fetchFile(
    gitHubRepo: GitHubRepo,
    path: string
  ): Promise<Result<string, SyncError>>;

  /**
   * GitHubリポジトリからファイル一覧を取得する
   * @param gitHubRepo GitHubリポジトリ
   * @returns ファイルパスの配列
   */
  fetchFiles(gitHubRepo: GitHubRepo): Promise<Result<string[], SyncError>>;

  /**
   * GitHubリポジトリからファイルを取得し、文書を作成する
   * @param gitHubRepo GitHubリポジトリ
   * @param path ファイルパス
   * @param userId ユーザーID
   * @returns 作成された文書
   */
  syncFile(
    gitHubRepo: GitHubRepo,
    path: string,
    userId: ID
  ): Promise<Result<Document, SyncError>>;

  /**
   * GitHubリポジトリからすべてのファイルを取得し、文書を作成する
   * @param gitHubRepo GitHubリポジトリ
   * @param userId ユーザーID
   * @returns 作成された文書の配列
   */
  syncAllFiles(
    gitHubRepo: GitHubRepo,
    userId: ID
  ): Promise<Result<Document[], SyncError>>;
} 