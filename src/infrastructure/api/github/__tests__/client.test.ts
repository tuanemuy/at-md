import { describe, it, expect, vi, beforeEach } from "vitest";
import { Octokit } from "@octokit/rest";
import { GitHubClient } from "../client";
import { generateId } from "@/domain/shared/models/id";
import { createGitHubRepo } from "@/domain/document/models/githubRepo";
import * as loggerModule from "@/lib/logger";

// Octokitのモック
vi.mock("@octokit/rest", () => {
  return {
    Octokit: vi.fn().mockImplementation(() => ({
      repos: {
        getContent: vi.fn(),
      },
    })),
  };
});

describe("GitHubClient", () => {
  let client: GitHubClient;
  let mockOctokit: { repos: { getContent: ReturnType<typeof vi.fn> } };
  const mockRepo = createGitHubRepo(
    "testowner",
    "testrepo",
    "installation-123",
    generateId()
  );
  const mockRepoWithId = { id: generateId(), ...mockRepo };

  beforeEach(() => {
    // ロガーをモック化
    vi.spyOn(loggerModule.logger, "info").mockImplementation(() => {});
    vi.spyOn(loggerModule.logger, "error").mockImplementation(() => {});

    // Octokitのモックをリセット
    vi.clearAllMocks();
    
    // クライアントを初期化
    client = new GitHubClient();
    mockOctokit = (Octokit as unknown as ReturnType<typeof vi.fn>).mock.results[0].value;
  });

  describe("fetchFile", () => {
    it("ファイルが存在する場合、ファイルの内容を返すこと", async () => {
      // モックの設定
      const mockContent = "# Test Content";
      const base64Content = Buffer.from(mockContent).toString("base64");
      mockOctokit.repos.getContent.mockResolvedValueOnce({
        data: {
          content: base64Content,
          type: "file",
        },
      });

      // テスト実行
      const result = await client.fetchFile(mockRepoWithId, "test.md");

      // 検証
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toBe(mockContent);
      }

      // APIが正しく呼び出されたことを確認
      expect(mockOctokit.repos.getContent).toHaveBeenCalledWith({
        owner: mockRepoWithId.owner,
        repo: mockRepoWithId.name,
        path: "test.md",
        headers: {
          authorization: `Bearer ${mockRepoWithId.installationId}`,
        },
      });
    });

    it("ファイルが存在しない場合、FILE_NOT_FOUNDエラーを返すこと", async () => {
      // モックの設定
      const notFoundError = new Error("Not Found");
      mockOctokit.repos.getContent.mockRejectedValueOnce(notFoundError);

      // テスト実行
      const result = await client.fetchFile(mockRepoWithId, "nonexistent.md");

      // 検証
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("FILE_NOT_FOUND");
        expect(result.error.message).toContain("File not found");
        expect(result.error.cause).toBe(notFoundError);
      }
    });

    it("レスポンスにcontentプロパティがない場合、FILE_NOT_FOUNDエラーを返すこと", async () => {
      // モックの設定
      mockOctokit.repos.getContent.mockResolvedValueOnce({
        data: {
          // contentプロパティなし
          type: "file",
        },
      });

      // テスト実行
      const result = await client.fetchFile(mockRepoWithId, "test.md");

      // 検証
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("FILE_NOT_FOUND");
        expect(result.error.message).toContain("File content not found");
      }
    });

    it("APIエラーが発生した場合、API_ERRORエラーを返すこと", async () => {
      // モックの設定
      const apiError = new Error("API Error");
      mockOctokit.repos.getContent.mockRejectedValueOnce(apiError);

      // テスト実行
      const result = await client.fetchFile(mockRepoWithId, "test.md");

      // 検証
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("API_ERROR");
        expect(result.error.message).toContain("Failed to fetch file");
        expect(result.error.cause).toBe(apiError);
      }
    });
  });

  describe("fetchFiles", () => {
    it("リポジトリにMarkdownファイルが存在する場合、ファイルパスの配列を返すこと", async () => {
      // モックの設定
      // ルートディレクトリの内容
      mockOctokit.repos.getContent.mockResolvedValueOnce({
        data: [
          { path: "README.md", type: "file" },
          { path: "docs", type: "dir" },
          { path: "src", type: "dir" },
          { path: "LICENSE", type: "file" },
        ],
      });

      // docsディレクトリの内容
      mockOctokit.repos.getContent.mockResolvedValueOnce({
        data: [
          { path: "docs/guide.md", type: "file" },
          { path: "docs/api", type: "dir" },
        ],
      });

      // docs/apiディレクトリの内容
      mockOctokit.repos.getContent.mockResolvedValueOnce({
        data: [
          { path: "docs/api/endpoints.md", type: "file" },
        ],
      });

      // srcディレクトリの内容
      mockOctokit.repos.getContent.mockResolvedValueOnce({
        data: [
          { path: "src/index.ts", type: "file" },
        ],
      });

      // テスト実行
      const result = await client.fetchFiles(mockRepoWithId);

      // 検証
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value).toEqual([
          "README.md",
          "docs/guide.md",
          "docs/api/endpoints.md",
        ]);
      }
    });

    it("リポジトリが存在しない場合、GITHUREPO_NOT_FOUNDエラーを返すこと", async () => {
      // モックの設定
      const notFoundError = new Error("Not Found");
      mockOctokit.repos.getContent.mockRejectedValueOnce(notFoundError);

      // テスト実行
      const result = await client.fetchFiles(mockRepoWithId);

      // 検証
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("GITHUREPO_NOT_FOUND");
        expect(result.error.message).toContain("Repository not found");
        expect(result.error.cause).toBe(notFoundError);
      }
    });

    it("APIエラーが発生した場合、API_ERRORエラーを返すこと", async () => {
      // モックの設定
      const apiError = new Error("API Error");
      mockOctokit.repos.getContent.mockRejectedValueOnce(apiError);

      // テスト実行
      const result = await client.fetchFiles(mockRepoWithId);

      // 検証
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("API_ERROR");
        expect(result.error.message).toContain("Failed to fetch files");
        expect(result.error.cause).toBe(apiError);
      }
    });
  });

  describe("syncFile", () => {
    it("未実装のため、API_ERRORエラーを返すこと", async () => {
      // テスト実行
      const result = await client.syncFile(mockRepoWithId, "test.md", generateId());

      // 検証
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("API_ERROR");
        expect(result.error.message).toContain("Method not implemented");
      }
    });
  });

  describe("syncAllFiles", () => {
    it("未実装のため、API_ERRORエラーを返すこと", async () => {
      // テスト実行
      const result = await client.syncAllFiles(mockRepoWithId, generateId());

      // 検証
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("API_ERROR");
        expect(result.error.message).toContain("Method not implemented");
      }
    });
  });
}); 