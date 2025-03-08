import { Result } from "npm:neverthrow";
import { InfrastructureError } from "../../../core/errors/base.ts";

/**
 * GitHub APIアダプターのエラー型
 */
export class GitHubApiError extends InfrastructureError {
  override readonly cause?: Error;

  constructor(message: string, cause?: Error) {
    super(message);
    this.name = "GitHubApiError";
    this.cause = cause;
  }
}

/**
 * リポジトリの情報
 */
export interface GitHubRepository {
  id: number;
  name: string;
  fullName: string;
  description: string | null;
  defaultBranch: string;
  private: boolean;
  owner: {
    login: string;
    id: number;
  };
  htmlUrl: string;
  apiUrl: string;
  updatedAt: string;
}

/**
 * コンテンツの情報
 */
export interface GitHubContent {
  name: string;
  path: string;
  sha: string;
  size: number;
  type: "file" | "dir" | "symlink" | "submodule";
  content?: string;
  encoding?: "base64";
  htmlUrl: string;
  downloadUrl: string | null;
  url: string;
}

/**
 * コミットの情報
 */
export interface GitHubCommit {
  sha: string;
  message: string;
  author: {
    name: string;
    email: string;
    date: string;
  };
  committer: {
    name: string;
    email: string;
    date: string;
  };
  url: string;
}

/**
 * GitHub APIアダプターのインターフェース
 * 
 * GitHub APIとの通信を抽象化するインターフェース
 */
export interface GitHubApiAdapter {
  /**
   * ユーザーのリポジトリ一覧を取得する
   * 
   * @param username GitHubのユーザー名
   * @returns リポジトリ一覧のResult
   */
  getRepositories(username: string): Promise<Result<GitHubRepository[], GitHubApiError>>;

  /**
   * リポジトリの情報を取得する
   * 
   * @param owner リポジトリのオーナー
   * @param repo リポジトリ名
   * @returns リポジトリ情報のResult
   */
  getRepository(owner: string, repo: string): Promise<Result<GitHubRepository, GitHubApiError>>;

  /**
   * リポジトリのコンテンツを取得する
   * 
   * @param owner リポジトリのオーナー
   * @param repo リポジトリ名
   * @param path ファイルパス
   * @param ref ブランチ名またはコミットSHA（省略時はデフォルトブランチ）
   * @returns コンテンツのResult
   */
  getContent(owner: string, repo: string, path: string, ref?: string): Promise<Result<GitHubContent, GitHubApiError>>;

  /**
   * ディレクトリの内容を取得する
   * 
   * @param owner リポジトリのオーナー
   * @param repo リポジトリ名
   * @param path ディレクトリパス
   * @param ref ブランチ名またはコミットSHA（省略時はデフォルトブランチ）
   * @returns コンテンツ一覧のResult
   */
  getContents(owner: string, repo: string, path: string, ref?: string): Promise<Result<GitHubContent[], GitHubApiError>>;

  /**
   * コミット履歴を取得する
   * 
   * @param owner リポジトリのオーナー
   * @param repo リポジトリ名
   * @param path ファイルパス（省略時はリポジトリ全体）
   * @param ref ブランチ名またはコミットSHA（省略時はデフォルトブランチ）
   * @returns コミット一覧のResult
   */
  getCommits(owner: string, repo: string, path?: string, ref?: string): Promise<Result<GitHubCommit[], GitHubApiError>>;

  /**
   * ファイルの特定のコミット時点の内容を取得する
   * 
   * @param owner リポジトリのオーナー
   * @param repo リポジトリ名
   * @param path ファイルパス
   * @param sha コミットSHA
   * @returns コンテンツのResult
   */
  getContentAtCommit(owner: string, repo: string, path: string, sha: string): Promise<Result<GitHubContent, GitHubApiError>>;

  /**
   * Webhookを検証する
   * 
   * @param payload Webhookのペイロード
   * @param signature Webhookの署名
   * @param secret Webhookのシークレット
   * @returns 検証結果のResult
   */
  verifyWebhook(payload: string, signature: string, secret: string): Result<boolean, GitHubApiError>;
} 