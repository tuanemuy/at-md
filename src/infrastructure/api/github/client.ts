import { Octokit } from "@octokit/rest";
import { Result, ok, err } from "neverthrow";
import { logger } from "@/lib/logger";
import type { GitHubRepo } from "@/domain/document/models/githubRepo";
import type { SyncService } from "@/domain/document/services/sync";
import { createSyncError, type SyncError } from "@/domain/document/models/errors";
import type { ID } from "@/domain/shared/models/id";
import type { Document } from "@/domain/document/models/document";

/**
 * GitHub APIクライアントの設定
 */
export interface GitHubClientConfig {
  /**
   * GitHub APIのベースURL
   * @default "https://api.github.com"
   */
  baseUrl?: string;

  /**
   * GitHub APIのタイムアウト（ミリ秒）
   * @default 10000
   */
  timeout?: number;

  /**
   * GitHub APIのユーザーエージェント
   * @default "at-md"
   */
  userAgent?: string;
}

/**
 * GitHub APIクライアント
 */
export class GitHubClient implements SyncService {
  private readonly octokit: Octokit;
  private readonly config: Required<GitHubClientConfig>;

  /**
   * GitHub APIクライアントを作成する
   * @param config クライアント設定
   */
  constructor(config: GitHubClientConfig = {}) {
    this.config = {
      baseUrl: config.baseUrl ?? "https://api.github.com",
      timeout: config.timeout ?? 10000,
      userAgent: config.userAgent ?? "at-md",
    };

    this.octokit = new Octokit({
      baseUrl: this.config.baseUrl,
      request: {
        timeout: this.config.timeout,
      },
      userAgent: this.config.userAgent,
    });

    logger.info("GitHubClient initialized", { config: this.config });
  }

  /**
   * GitHubリポジトリからファイルを取得する
   * @param gitHubRepo GitHubリポジトリ
   * @param path ファイルパス
   * @returns ファイルの内容
   */
  async fetchFile(
    gitHubRepo: GitHubRepo,
    path: string
  ): Promise<Result<string, SyncError>> {
    try {
      logger.info("Fetching file from GitHub", {
        owner: gitHubRepo.owner,
        repo: gitHubRepo.name,
        path,
      });

      // GitHub APIを使用してファイルを取得
      const response = await this.octokit.repos.getContent({
        owner: gitHubRepo.owner,
        repo: gitHubRepo.name,
        path,
        headers: {
          authorization: `Bearer ${gitHubRepo.installationId}`,
        },
      });

      // レスポンスの型チェック
      if (!("content" in response.data) || !response.data.content) {
        return err(
          createSyncError(
            "FILE_NOT_FOUND",
            `File content not found: ${path}`,
            new Error("Content property missing in response")
          )
        );
      }

      // Base64でエンコードされたコンテンツをデコード
      const content = Buffer.from(response.data.content, "base64").toString();
      return ok(content);
    } catch (error) {
      logger.error("Error fetching file from GitHub", {
        owner: gitHubRepo.owner,
        repo: gitHubRepo.name,
        path,
        error,
      });

      // エラーの種類に応じて適切なエラーを返す
      if (error instanceof Error) {
        if (error.message.includes("Not Found")) {
          return err(
            createSyncError(
              "FILE_NOT_FOUND",
              `File not found: ${path}`,
              error
            )
          );
        }
        return err(
          createSyncError(
            "API_ERROR",
            `Failed to fetch file: ${path}`,
            error
          )
        );
      }
      return err(
        createSyncError(
          "API_ERROR",
          `Unknown error fetching file: ${path}`,
          new Error(String(error))
        )
      );
    }
  }

  /**
   * GitHubリポジトリからファイル一覧を取得する
   * @param gitHubRepo GitHubリポジトリ
   * @returns ファイルパスの配列
   */
  async fetchFiles(
    gitHubRepo: GitHubRepo
  ): Promise<Result<string[], SyncError>> {
    try {
      logger.info("Fetching files from GitHub", {
        owner: gitHubRepo.owner,
        repo: gitHubRepo.name,
      });

      // 再帰的にファイルを取得する関数
      const getFilesRecursively = async (
        path = ""
      ): Promise<string[]> => {
        const response = await this.octokit.repos.getContent({
          owner: gitHubRepo.owner,
          repo: gitHubRepo.name,
          path,
          headers: {
            authorization: `Bearer ${gitHubRepo.installationId}`,
          },
        });

        // 単一ファイルの場合
        if (!Array.isArray(response.data)) {
          if (path.endsWith(".md")) {
            return [path];
          }
          return [];
        }

        // ディレクトリの場合は再帰的に処理
        const files: string[] = [];
        for (const item of response.data) {
          if (item.type === "file" && item.path.endsWith(".md")) {
            files.push(item.path);
          } else if (item.type === "dir") {
            const subFiles = await getFilesRecursively(item.path);
            files.push(...subFiles);
          }
        }

        return files;
      };

      const files = await getFilesRecursively();
      return ok(files);
    } catch (error) {
      logger.error("Error fetching files from GitHub", {
        owner: gitHubRepo.owner,
        repo: gitHubRepo.name,
        error,
      });

      // エラーの種類に応じて適切なエラーを返す
      if (error instanceof Error) {
        if (error.message.includes("Not Found")) {
          return err(
            createSyncError(
              "GITHUREPO_NOT_FOUND",
              `Repository not found: ${gitHubRepo.fullName}`,
              error
            )
          );
        }
        return err(
          createSyncError(
            "API_ERROR",
            `Failed to fetch files from repository: ${gitHubRepo.fullName}`,
            error
          )
        );
      }
      return err(
        createSyncError(
          "API_ERROR",
          `Unknown error fetching files: ${gitHubRepo.fullName}`,
          new Error(String(error))
        )
      );
    }
  }

  /**
   * GitHubリポジトリからファイルを取得し、文書を作成する
   * @param gitHubRepo GitHubリポジトリ
   * @param path ファイルパス
   * @param userId ユーザーID
   * @returns 作成された文書
   */
  async syncFile(
    gitHubRepo: GitHubRepo,
    path: string,
    userId: ID
  ): Promise<Result<Document, SyncError>> {
    // この実装はアプリケーション層で行うため、ここでは未実装
    return err(
      createSyncError(
        "API_ERROR",
        "Method not implemented in infrastructure layer",
        new Error("Not implemented")
      )
    );
  }

  /**
   * GitHubリポジトリからすべてのファイルを取得し、文書を作成する
   * @param gitHubRepo GitHubリポジトリ
   * @param userId ユーザーID
   * @returns 作成された文書の配列
   */
  async syncAllFiles(
    gitHubRepo: GitHubRepo,
    userId: ID
  ): Promise<Result<Document[], SyncError>> {
    // この実装はアプリケーション層で行うため、ここでは未実装
    return err(
      createSyncError(
        "API_ERROR",
        "Method not implemented in infrastructure layer",
        new Error("Not implemented")
      )
    );
  }
} 