import type { GitHubAppProvider } from "@/domain/account/adapters/github-app-provider";
import {
  type GitHubInstallation,
  gitHubInstallationSchema,
} from "@/domain/account/dtos/github-installation";
import {
  ExternalServiceError,
  ExternalServiceErrorCode,
} from "@/domain/types/error";
import { type Result, err, ok } from "@/lib/result";
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

  async getInstallations(
    accessToken: string,
  ): Promise<Result<GitHubInstallation[], ExternalServiceError>> {
    try {
      const octokit = new Octokit({
        auth: accessToken,
      });

      const response =
        await octokit.rest.apps.listInstallationsForAuthenticatedUser();

      if (response.status !== 200) {
        return err(
          new ExternalServiceError(
            "GitHub",
            ExternalServiceErrorCode.REQUEST_FAILED,
            `HTTP status: ${response.status}`,
          ),
        );
      }

      const installations = response.data.installations
        .map((installation: Record<string, unknown>) => {
          return gitHubInstallationSchema.safeParse(installation).data;
        })
        .filter(
          (installation): installation is GitHubInstallation =>
            installation !== undefined,
        );

      return ok(installations);
    } catch (error) {
      return err(
        new ExternalServiceError(
          "GitHub",
          ExternalServiceErrorCode.REQUEST_FAILED,
          "Failed to get installations",
          error instanceof Error ? error : undefined,
        ),
      );
    }
  }

  async getAccessToken(code: string): Promise<
    Result<
      {
        accessToken: string;
        refreshToken?: string;
      },
      ExternalServiceError
    >
  > {
    try {
      const response = await fetch(
        "https://github.com/login/oauth/access_token",
        {
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
        },
      );

      if (!response.ok) {
        return err(
          new ExternalServiceError(
            "GitHub",
            ExternalServiceErrorCode.REQUEST_FAILED,
            `HTTP status: ${response.status}`,
          ),
        );
      }

      const data = await response.json();
      return ok({
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
      });
    } catch (error) {
      console.error("Error getting GitHub access token:", error);
      return err(
        new ExternalServiceError(
          "GitHub",
          ExternalServiceErrorCode.UNEXPECTED_ERROR,
          "An unexpected error occurred while fetching access token",
          error instanceof Error ? error : new Error(String(error)),
        ),
      );
    }
  }
}
