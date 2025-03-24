import type { GitHubContentProvider } from "@/domain/note/adapters/github-content-provider";
import {
  type GitHubRepository,
  gitHubRepositorySchema,
} from "@/domain/note/dtos";
import {
  ExternalServiceError,
  ExternalServiceErrorCode,
} from "@/domain/types/error";
import { type Result, err, ok } from "@/lib/result";
import { Octokit } from "octokit";

export class DefaultGitHubContentProvider implements GitHubContentProvider {
  private webhookUrl: string;

  constructor(params: {
    config: {
      webhookUrl: string;
    };
  }) {
    this.webhookUrl = params.config.webhookUrl;
  }

  async listRepositories(
    accessToken: string,
  ): Promise<Result<GitHubRepository[], ExternalServiceError>> {
    try {
      const octokit = new Octokit({
        auth: accessToken,
      });

      const response = await octokit.rest.repos.listForAuthenticatedUser({
        visibility: "all",
        sort: "updated",
        per_page: 100, // 最大数を取得
      });

      if (response.status !== 200) {
        return err(
          new ExternalServiceError(
            "GitHub",
            ExternalServiceErrorCode.REQUEST_FAILED,
            `HTTP status: ${response.status}`,
          ),
        );
      }

      const repositories = response.data
        // biome-ignore lint:
        .map((repo: any) => {
          return gitHubRepositorySchema.safeParse({
            owner: repo.owner?.login,
            name: repo.name,
            fullName: repo.full_name,
          }).data;
        })
        .filter((repo): repo is GitHubRepository => repo !== undefined);

      return ok(repositories);
    } catch (error) {
      console.error("Error listing repositories:", error);
      return err(
        new ExternalServiceError(
          "GitHub",
          ExternalServiceErrorCode.UNEXPECTED_ERROR,
          "Failed to list repositories",
          error instanceof Error ? error : undefined,
        ),
      );
    }
  }

  async getContent(
    accessToken: string,
    owner: string,
    repo: string,
    path: string,
  ): Promise<Result<string, ExternalServiceError>> {
    try {
      const octokit = new Octokit({
        auth: accessToken,
      });

      const response = await octokit.rest.repos.getContent({
        owner,
        repo,
        path,
      });

      if (response.status !== 200) {
        return err(
          new ExternalServiceError(
            "GitHub",
            ExternalServiceErrorCode.REQUEST_FAILED,
            `HTTP status: ${response.status}`,
          ),
        );
      }

      if (Array.isArray(response.data)) {
        return err(
          new ExternalServiceError(
            "GitHub",
            ExternalServiceErrorCode.RESPONSE_INVALID,
            "Path is a directory, not a file",
          ),
        );
      }

      if (!("content" in response.data) || !response.data.content) {
        return err(
          new ExternalServiceError(
            "GitHub",
            ExternalServiceErrorCode.RESPONSE_INVALID,
            "Content not found in response",
          ),
        );
      }

      // Base64でエンコードされたコンテンツをデコード
      const content = Buffer.from(response.data.content, "base64").toString();
      return ok(content);
    } catch (error) {
      console.error("Error getting content:", error);
      return err(
        new ExternalServiceError(
          "GitHub",
          ExternalServiceErrorCode.REQUEST_FAILED,
          "Failed to get content",
          error instanceof Error ? error : undefined,
        ),
      );
    }
  }

  async listPaths(
    accessToken: string,
    owner: string,
    repo: string,
  ): Promise<Result<string[], ExternalServiceError>> {
    try {
      const octokit = new Octokit({
        auth: accessToken,
      });

      // 再帰的にディレクトリを探索する関数
      const fetchPaths = async (
        path = "",
        allPaths: string[] = [],
      ): Promise<Result<string[], Error>> => {
        try {
          const response = await octokit.rest.repos.getContent({
            owner,
            repo,
            path,
          });

          if (response.status !== 200) {
            return err(new Error(`HTTP status: ${response.status}`));
          }

          if (!Array.isArray(response.data)) {
            return ok(path.endsWith(".md") ? [...allPaths, path] : allPaths);
          }

          // ディレクトリの場合、すべての項目を処理
          let newAllPaths = allPaths;
          for (const item of response.data) {
            if (item.type === "file" && item.name.endsWith(".md")) {
              // Markdownファイルの場合、パスを追加
              newAllPaths.push(item.path);
            } else if (item.type === "dir") {
              // ディレクトリの場合、再帰的に探索
              const dirResult = await fetchPaths(item.path, allPaths);
              if (dirResult.isErr()) {
                return dirResult;
              }
              // 結果を現在のパスリストにマージ
              newAllPaths = dirResult.value;
            }
          }

          return ok(newAllPaths);
        } catch (error) {
          return err(
            error instanceof Error ? error : new Error("Unexpected error"),
          );
        }
      };

      const pathsResult = await fetchPaths();
      if (pathsResult.isErr()) {
        return err(
          new ExternalServiceError(
            "GitHub",
            ExternalServiceErrorCode.UNEXPECTED_ERROR,
            `Failed to fetch paths at ${pathsResult.error.message}`,
            pathsResult.error,
          ),
        );
      }

      return ok(pathsResult.value);
    } catch (error) {
      return err(
        new ExternalServiceError(
          "GitHub",
          ExternalServiceErrorCode.UNEXPECTED_ERROR,
          "An unexpected error occurred while listing paths",
          error instanceof Error ? error : undefined,
        ),
      );
    }
  }

  async setupWebhook(
    accessToken: string,
    owner: string,
    repo: string,
  ): Promise<Result<number, ExternalServiceError>> {
    try {
      const octokit = new Octokit({
        auth: accessToken,
      });

      // 新しいウェブフックを作成
      const createResponse = await octokit.rest.repos.createWebhook({
        owner,
        repo,
        config: {
          url: this.webhookUrl,
          content_type: "json",
        },
        events: ["push"],
      });

      if (createResponse.status !== 201) {
        return err(
          new ExternalServiceError(
            "GitHub",
            ExternalServiceErrorCode.REQUEST_FAILED,
            `HTTP status: ${createResponse.status}`,
          ),
        );
      }

      return ok(createResponse.data.id);
    } catch (error) {
      console.error("Error setting up webhook:", error);
      return err(
        new ExternalServiceError(
          "GitHub",
          ExternalServiceErrorCode.REQUEST_FAILED,
          "Failed to create webhook",
          error instanceof Error ? error : undefined,
        ),
      );
    }
  }
}
