import type { GitHubAppProvider } from "@/domain/account/adapters/github-app-provider";
import {
  type GitHubInstallation,
  gitHubInstallationSchema,
} from "@/domain/account/dtos/github-installation";
import {
  ExternalServiceError,
  ExternalServiceErrorCode,
} from "@/domain/types/error";
import { ResultAsync, err, errAsync, ok } from "@/lib/result";
import { Octokit } from "octokit";

export class DefaultGitHubAppProvider implements GitHubAppProvider {
  private clientId: string;
  private clientSecret: string;

  constructor(params: {
    config: {
      clientId: string;
      clientSecret: string;
    };
  }) {
    this.clientId = params.config.clientId;
    this.clientSecret = params.config.clientSecret;
  }

  getInstallations(accessToken: string) {
    return ResultAsync.fromPromise(
      new Octokit({
        auth: accessToken,
      }).rest.apps.listInstallationsForAuthenticatedUser(),
      (e) => e,
    )
      .andThen((response) =>
        response.status === 200
          ? ok(response.data.installations)
          : err(new Error(`HTTP status: ${response.status}`)),
      )
      .map((installations) =>
        installations
          .map(
            (installation) =>
              gitHubInstallationSchema.safeParse(installation).data,
          )
          .filter(
            (installation): installation is GitHubInstallation =>
              installation !== undefined,
          ),
      )
      .mapErr(
        (error) =>
          new ExternalServiceError(
            "GitHub",
            ExternalServiceErrorCode.REQUEST_FAILED,
            "Failed to get installations",
            error,
          ),
      );
  }

  getAccessToken(code: string): ResultAsync<
    {
      accessToken: string;
      refreshToken?: string;
    },
    ExternalServiceError
  > {
    return ResultAsync.fromPromise(
      fetch("https://github.com/login/oauth/access_token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          client_id: this.clientId,
          client_secret: this.clientSecret,
          code,
        }),
      }),
      (e) => e,
    )
      .andThen((response) =>
        response.ok
          ? ResultAsync.fromPromise(response.json(), (e) => e)
          : errAsync(new Error(`HTTP status: ${response.status}`)),
      )
      .map((data) => ({
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
      }))
      .mapErr(
        (error) =>
          new ExternalServiceError(
            "GitHub",
            ExternalServiceErrorCode.REQUEST_FAILED,
            "Failed to get access token",
            error,
          ),
      );
  }
}
