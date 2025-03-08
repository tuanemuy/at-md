import { expect } from "@std/expect";
import { describe, it } from "@std/testing/bdd";
import { GitHubApiError } from "../github-api-adapter.ts";

describe("GitHubApiError", () => {
  it("正しい名前とメッセージでエラーを作成できること", () => {
    const error = new GitHubApiError("Test error message");
    
    expect(error.name).toBe("GitHubApiError");
    expect(error.message).toBe("Test error message");
    expect(error.cause).toBeUndefined();
  });

  it("原因となるエラーを含めて作成できること", () => {
    const cause = new Error("Original error");
    const error = new GitHubApiError("Test error message", cause);
    
    expect(error.name).toBe("GitHubApiError");
    expect(error.message).toBe("Test error message");
    expect(error.cause).toBe(cause);
  });
}); 