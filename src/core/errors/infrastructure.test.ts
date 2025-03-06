import { expect } from "@std/expect";
import { describe, it } from "@std/testing/bdd";
import { InfrastructureError } from "./base.ts";
import {
  DatabaseError,
  ExternalServiceError,
  NetworkError
} from "./infrastructure.ts";

describe("インフラストラクチャエラー", () => {
  it("正しい名前とメッセージでDatabaseErrorを作成すること", () => {
    // 期待する結果
    const operation = "insert";
    const detail = "Unique constraint violation";
    const expectedMessage = `Database error during ${operation}: ${detail}`;
    
    // 操作
    const error = new DatabaseError(operation, detail);
    
    // アサーション
    expect(error).toBeInstanceOf(InfrastructureError);
    expect(error).toBeInstanceOf(DatabaseError);
    expect(error.name).toBe("DatabaseError");
    expect(error.message).toBe(expectedMessage);
  });
  
  it("正しい名前とメッセージでExternalServiceErrorを作成すること", () => {
    // 期待する結果
    const service = "GitHub API";
    const operation = "fetchRepository";
    const detail = "Rate limit exceeded";
    const expectedMessage = `Error in ${service} during ${operation}: ${detail}`;
    
    // 操作
    const error = new ExternalServiceError(service, operation, detail);
    
    // アサーション
    expect(error).toBeInstanceOf(InfrastructureError);
    expect(error).toBeInstanceOf(ExternalServiceError);
    expect(error.name).toBe("ExternalServiceError");
    expect(error.message).toBe(expectedMessage);
  });
  
  it("正しい名前とメッセージでNetworkErrorを作成すること", () => {
    // 期待する結果
    const url = "https://api.example.com";
    const detail = "Connection timeout";
    const expectedMessage = `Network error while accessing ${url}: ${detail}`;
    
    // 操作
    const error = new NetworkError(url, detail);
    
    // アサーション
    expect(error).toBeInstanceOf(InfrastructureError);
    expect(error).toBeInstanceOf(NetworkError);
    expect(error.name).toBe("NetworkError");
    expect(error.message).toBe(expectedMessage);
  });
}); 