import type { GitHubContentProvider } from "@/domain/note/adapters/github-content-provider";
import {
  type GitHubRepository,
  gitHubRepositorySchema,
} from "@/domain/note/dtos";
import {
  ExternalServiceError,
  ExternalServiceErrorCode,
} from "@/domain/types/error";
import type { PaginationParams } from "@/domain/types/pagination";
import { ResultAsync, err, ok } from "@/lib/result";
import { App, Octokit } from "octokit";

export class DefaultGitHubContentProvider implements GitHubContentProvider {
  private webhookUrl: string;
  private webhookSecret: string;
  private appId: string;
  private privateKey: string;

  constructor(params: {
    config: {
      webhookUrl: string;
      webhookSecret: string;
      appId: string;
      privateKey: string;
    };
  }) {
    this.webhookUrl = params.config.webhookUrl;
    this.webhookSecret = params.config.webhookSecret;
    this.appId = params.config.appId;
    this.privateKey = params.config.privateKey;
  }

  searchRepositories(
    accessToken: string,
    query: string,
    owner: {
      type: "user" | "org";
      name: string;
    },
    pagination: PaginationParams,
  ) {
    return ResultAsync.fromPromise(
      new Octokit({ auth: accessToken }).rest.search.repos({
        q: `${encodeURIComponent(query)} in:name ${owner.type}:${owner.name}`,
        sort: getSortSearchRepositories(pagination?.orderBy),
        order: pagination?.order,
        per_page: pagination?.limit || 10,
        page: pagination?.page || 1,
      }),
      (e) => e,
    )
      .andThen((response) =>
        response.status === 200
          ? ok(response.data)
          : err(new Error(`HTTP status: ${response.status}`)),
      )
      .map(({ total_count, items }) => ({
        repositories: items
          .map(
            (repo) =>
              gitHubRepositorySchema.safeParse({
                owner: repo.owner?.login,
                name: repo.name,
                fullName: repo.full_name,
              }).data,
          )
          .filter((repo): repo is GitHubRepository => repo !== undefined),
        count: total_count,
      }))
      .mapErr(
        (error) =>
          new ExternalServiceError(
            "GitHub",
            ExternalServiceErrorCode.REQUEST_FAILED,
            "Failed to get repositories",
            error,
          ),
      );
  }

  listRepositories(accessToken: string, pagination?: PaginationParams) {
    return ResultAsync.fromPromise(
      new Octokit({ auth: accessToken }).rest.repos.listForAuthenticatedUser({
        visibility: "all",
        sort: getSortForListRepositories(pagination?.orderBy),
        order: pagination?.order,
        per_page: pagination?.limit || 10,
        page: pagination?.page || 1,
      }),
      (e) => e,
    )
      .andThen((response) =>
        response.status === 200
          ? ok(response.data)
          : err(new Error(`HTTP status: ${response.status}`)),
      )
      .map((repositories) =>
        repositories
          .map(
            (repo) =>
              gitHubRepositorySchema.safeParse({
                owner: repo.owner?.login,
                name: repo.name,
                fullName: repo.full_name,
              }).data,
          )
          .filter((repo): repo is GitHubRepository => repo !== undefined),
      )
      .mapErr(
        (error) =>
          new ExternalServiceError(
            "GitHub",
            ExternalServiceErrorCode.REQUEST_FAILED,
            "Failed to get repositories",
            error,
          ),
      );
  }

  getContent(accessToken: string, owner: string, repo: string, path: string) {
    return ResultAsync.fromPromise(
      new Octokit({ auth: accessToken }).rest.repos.getContent({
        owner,
        repo,
        path,
      }),
      (e) => e,
    )
      .andThen((response) =>
        response.status === 200
          ? ok(response.data)
          : err(new Error(`HTTP status: ${response.status}`)),
      )
      .andThen((data) =>
        Array.isArray(data)
          ? err(new Error("Path is a directory, not a file"))
          : ok(data),
      )
      .andThen((data) =>
        !("content" in data) || !data.content
          ? err(new Error("Content not found in response"))
          : ok(data.content),
      )
      .map((content) => Buffer.from(content, "base64").toString())
      .mapErr(
        (error) =>
          new ExternalServiceError(
            "GitHub",
            ExternalServiceErrorCode.REQUEST_FAILED,
            "Failed to get content",
            error,
          ),
      );
  }

  getContentByInstallation(
    installationId: number,
    owner: string,
    repo: string,
    path: string,
  ) {
    return ResultAsync.fromPromise(
      new App({
        appId: this.appId,
        privateKey: this.privateKey,
      }).getInstallationOctokit(installationId),
      (e) => e,
    )
      .andThen((octokit) =>
        ResultAsync.fromPromise(
          octokit.rest.repos.getContent({
            owner,
            repo,
            path,
          }),
          (e) => e,
        ),
      )
      .andThen((response) =>
        response.status === 200
          ? ok(response.data)
          : err(new Error(`HTTP status: ${response.status}`)),
      )
      .andThen((data) =>
        Array.isArray(data)
          ? err(new Error("Path is a directory, not a file"))
          : ok(data),
      )
      .andThen((data) =>
        !("content" in data) || !data.content
          ? err(new Error("Content not found in response"))
          : ok(data.content),
      )
      .map((content) => Buffer.from(content, "base64").toString())
      .mapErr(
        (error) =>
          new ExternalServiceError(
            "GitHub",
            ExternalServiceErrorCode.REQUEST_FAILED,
            "Failed to get content",
            error,
          ),
      );
  }

  listPaths(accessToken: string, owner: string, repo: string) {
    const octokit = new Octokit({
      auth: accessToken,
    });

    return ResultAsync.fromPromise(
      this.fetchPaths(octokit, owner, repo, "main"),
      (e) => e,
    ).mapErr(
      (error) =>
        new ExternalServiceError(
          "GitHub",
          ExternalServiceErrorCode.REQUEST_FAILED,
          "Failed to fetch paths",
          error,
        ),
    );
  }

  async fetchPaths(
    octokit: Octokit,
    owner: string,
    repo: string,
    sha: string,
    parent?: string,
  ): Promise<string[]> {
    try {
      const response = await octokit.rest.git.getTree({
        owner,
        repo,
        tree_sha: sha,
      });

      if (response.status !== 200) {
        return [];
      }

      return (
        await Promise.all(
          response.data.tree.map(async (item) => {
            const fullPath = parent ? `${parent}/${item.path}` : item.path;
            if (
              item.type === "blob" &&
              item.path?.endsWith(".md") &&
              item.path !== "README.md"
            ) {
              return [fullPath];
            }

            if (item.type === "tree" && item.sha) {
              return this.fetchPaths(octokit, owner, repo, item.sha, fullPath);
            }

            return [];
          }),
        )
      ).flat();
    } catch (error) {
      return [];
    }
  }

  setupWebhook(accessToken: string, owner: string, repo: string) {
    return ResultAsync.fromPromise(
      new Octokit({
        auth: accessToken,
      }).rest.repos.createWebhook({
        owner,
        repo,
        config: {
          url: this.webhookUrl,
          content_type: "json",
        },
        events: ["push"],
      }),
      (e) => e,
    )
      .andThen((response) =>
        response.status === 201
          ? ok(response.data.id)
          : err(new Error(`HTTP status: ${response.status}`)),
      )
      .mapErr(
        (error) =>
          new ExternalServiceError(
            "GitHub",
            ExternalServiceErrorCode.REQUEST_FAILED,
            "Failed to setup webhook",
            error,
          ),
      );
  }

  validateWebhook(secret: string) {
    return secret === this.webhookSecret;
  }

  deleteWebhook(
    accessToken: string,
    owner: string,
    repo: string,
    webhookId: number,
  ) {
    return ResultAsync.fromPromise(
      new Octokit({
        auth: accessToken,
      }).rest.repos.deleteWebhook({
        owner,
        repo,
        hook_id: webhookId,
      }),
      (e) => e,
    )
      .andThen((response) =>
        response.status === 204
          ? ok()
          : err(new Error(`HTTP status: ${response.status}`)),
      )
      .mapErr(
        (error) =>
          new ExternalServiceError(
            "GitHub",
            ExternalServiceErrorCode.REQUEST_FAILED,
            "Failed to delete webhook",
            error,
          ),
      );
  }
}

function getSortForListRepositories(name?: string) {
  if (["created", "updated", "pushed", "full_name"].includes(name || "")) {
    return name as "created" | "updated" | "pushed" | "full_name";
  }
  return "updated";
}

function getSortSearchRepositories(name?: string) {
  if (
    ["stars", "forks", "help-wanted-issues", "updated"].includes(name || "")
  ) {
    return name as "stars" | "forks" | "help-wanted-issues" | "updated";
  }
  return undefined;
}
