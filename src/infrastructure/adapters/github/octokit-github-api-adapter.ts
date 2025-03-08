import { Result, err, ok } from "npm:neverthrow";
import { Octokit } from "npm:octokit";
import { createNodeMiddleware, Webhooks } from "npm:@octokit/webhooks";
import { createHmac } from "node:crypto";
import { GitHubApiAdapter, GitHubApiError, GitHubRepository, GitHubContent, GitHubCommit } from "./github-api-adapter.ts";

// Octokitのレスポンス型
type OctokitRepo = {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  default_branch: string;
  private: boolean;
  owner: {
    login: string;
    id: number;
  };
  html_url: string;
  url: string;
  updated_at: string;
};

type OctokitContent = {
  name: string;
  path: string;
  sha: string;
  size: number;
  type: "file" | "dir" | "symlink" | "submodule";
  content?: string;
  encoding?: "base64";
  html_url: string;
  download_url: string | null;
  url: string;
};

type OctokitCommit = {
  sha: string;
  commit: {
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
  };
  html_url: string;
};

/**
 * Octokit.jsを使用したGitHub APIアダプターの実装
 */
export class OctokitGitHubApiAdapter implements GitHubApiAdapter {
  private octokit: Octokit;
  private webhooks: Webhooks;

  /**
   * コンストラクタ
   * 
   * @param token GitHub APIのアクセストークン
   * @param webhookSecret Webhookのシークレット（省略可）
   */
  constructor(token: string, webhookSecret?: string) {
    this.octokit = new Octokit({ auth: token });
    this.webhooks = new Webhooks({ secret: webhookSecret || "" });
  }

  /**
   * ユーザーのリポジトリ一覧を取得する
   * 
   * @param username GitHubのユーザー名
   * @returns リポジトリ一覧のResult
   */
  async getRepositories(username: string): Promise<Result<GitHubRepository[], GitHubApiError>> {
    try {
      const response = await this.octokit.rest.repos.listForUser({
        username,
        per_page: 100,
      });

      const repositories = response.data.map(repo => this.mapRepository(repo as OctokitRepo));
      return ok(repositories);
    } catch (error) {
      return err(new GitHubApiError(`Failed to get repositories for user ${username}`, error as Error));
    }
  }

  /**
   * リポジトリの情報を取得する
   * 
   * @param owner リポジトリのオーナー
   * @param repo リポジトリ名
   * @returns リポジトリ情報のResult
   */
  async getRepository(owner: string, repo: string): Promise<Result<GitHubRepository, GitHubApiError>> {
    try {
      const response = await this.octokit.rest.repos.get({
        owner,
        repo,
      });

      return ok(this.mapRepository(response.data as OctokitRepo));
    } catch (error) {
      return err(new GitHubApiError(`Failed to get repository ${owner}/${repo}`, error as Error));
    }
  }

  /**
   * リポジトリのコンテンツを取得する
   * 
   * @param owner リポジトリのオーナー
   * @param repo リポジトリ名
   * @param path ファイルパス
   * @param ref ブランチ名またはコミットSHA（省略時はデフォルトブランチ）
   * @returns コンテンツのResult
   */
  async getContent(owner: string, repo: string, path: string, ref?: string): Promise<Result<GitHubContent, GitHubApiError>> {
    try {
      const response = await this.octokit.rest.repos.getContent({
        owner,
        repo,
        path,
        ref,
      });

      // レスポンスが配列の場合はディレクトリなのでエラーを返す
      if (Array.isArray(response.data)) {
        return err(new GitHubApiError(`Path ${path} is a directory, not a file`));
      }

      return ok(this.mapContent(response.data as OctokitContent));
    } catch (error) {
      return err(new GitHubApiError(`Failed to get content ${owner}/${repo}/${path}`, error as Error));
    }
  }

  /**
   * ディレクトリの内容を取得する
   * 
   * @param owner リポジトリのオーナー
   * @param repo リポジトリ名
   * @param path ディレクトリパス
   * @param ref ブランチ名またはコミットSHA（省略時はデフォルトブランチ）
   * @returns コンテンツ一覧のResult
   */
  async getContents(owner: string, repo: string, path: string, ref?: string): Promise<Result<GitHubContent[], GitHubApiError>> {
    try {
      const response = await this.octokit.rest.repos.getContent({
        owner,
        repo,
        path,
        ref,
      });

      // レスポンスが配列でない場合はファイルなのでエラーを返す
      if (!Array.isArray(response.data)) {
        return err(new GitHubApiError(`Path ${path} is a file, not a directory`));
      }

      const contents = response.data.map(item => this.mapContent(item as OctokitContent));
      return ok(contents);
    } catch (error) {
      return err(new GitHubApiError(`Failed to get contents ${owner}/${repo}/${path}`, error as Error));
    }
  }

  /**
   * コミット履歴を取得する
   * 
   * @param owner リポジトリのオーナー
   * @param repo リポジトリ名
   * @param path ファイルパス（省略時はリポジトリ全体）
   * @param ref ブランチ名またはコミットSHA（省略時はデフォルトブランチ）
   * @returns コミット一覧のResult
   */
  async getCommits(owner: string, repo: string, path?: string, ref?: string): Promise<Result<GitHubCommit[], GitHubApiError>> {
    try {
      const response = await this.octokit.rest.repos.listCommits({
        owner,
        repo,
        path,
        sha: ref,
        per_page: 100,
      });

      const commits = await Promise.all(
        response.data.map(async commit => {
          // コミットの詳細情報を取得
          const detailResponse = await this.octokit.rest.repos.getCommit({
            owner,
            repo,
            ref: commit.sha,
          });

          return this.mapCommit(detailResponse.data as OctokitCommit);
        })
      );

      return ok(commits);
    } catch (error) {
      return err(new GitHubApiError(`Failed to get commits ${owner}/${repo}/${path || ""}`, error as Error));
    }
  }

  /**
   * ファイルの特定のコミット時点の内容を取得する
   * 
   * @param owner リポジトリのオーナー
   * @param repo リポジトリ名
   * @param path ファイルパス
   * @param sha コミットSHA
   * @returns コンテンツのResult
   */
  async getContentAtCommit(owner: string, repo: string, path: string, sha: string): Promise<Result<GitHubContent, GitHubApiError>> {
    return this.getContent(owner, repo, path, sha);
  }

  /**
   * Webhookを検証する
   * 
   * @param payload Webhookのペイロード
   * @param signature Webhookの署名
   * @param secret Webhookのシークレット
   * @returns 検証結果のResult
   */
  verifyWebhook(payload: string, signature: string, secret: string): Result<boolean, GitHubApiError> {
    try {
      const hmac = createHmac("sha256", secret);
      const digest = `sha256=${hmac.update(payload).digest("hex")}`;
      const isValid = signature === digest;
      
      return ok(isValid);
    } catch (error) {
      return err(new GitHubApiError("Failed to verify webhook", error as Error));
    }
  }

  /**
   * Webhookミドルウェアを作成する
   * 
   * @param path Webhookのパス
   * @returns Webhookミドルウェア
   */
  createWebhookMiddleware(path: string) {
    return createNodeMiddleware(this.webhooks, { path });
  }

  /**
   * GitHubのリポジトリオブジェクトをマッピングする
   * 
   * @param repo GitHubのリポジトリオブジェクト
   * @returns マッピングされたリポジトリ情報
   */
  private mapRepository(repo: OctokitRepo): GitHubRepository {
    return {
      id: repo.id,
      name: repo.name,
      fullName: repo.full_name,
      description: repo.description,
      defaultBranch: repo.default_branch,
      private: repo.private,
      owner: {
        login: repo.owner.login,
        id: repo.owner.id,
      },
      htmlUrl: repo.html_url,
      apiUrl: repo.url,
      updatedAt: repo.updated_at,
    };
  }

  /**
   * GitHubのコンテンツオブジェクトをマッピングする
   * 
   * @param content GitHubのコンテンツオブジェクト
   * @returns マッピングされたコンテンツ情報
   */
  private mapContent(content: OctokitContent): GitHubContent {
    return {
      name: content.name,
      path: content.path,
      sha: content.sha,
      size: content.size,
      type: content.type,
      content: content.content,
      encoding: content.encoding,
      htmlUrl: content.html_url,
      downloadUrl: content.download_url,
      url: content.url,
    };
  }

  /**
   * GitHubのコミットオブジェクトをマッピングする
   * 
   * @param commit GitHubのコミットオブジェクト
   * @returns マッピングされたコミット情報
   */
  private mapCommit(commit: OctokitCommit): GitHubCommit {
    return {
      sha: commit.sha,
      message: commit.commit.message,
      author: {
        name: commit.commit.author.name,
        email: commit.commit.author.email,
        date: commit.commit.author.date,
      },
      committer: {
        name: commit.commit.committer.name,
        email: commit.commit.committer.email,
        date: commit.commit.committer.date,
      },
      url: commit.html_url,
    };
  }
} 