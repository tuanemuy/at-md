import { expect } from "@std/expect";
import { describe, it } from "@std/testing/bdd";
import { DomainError, ApplicationError, InfrastructureError, PresentationError } from "./base.ts";

describe("エラー基底クラス", () => {
  it("正しい名前とメッセージでDomainErrorを作成すること", () => {
    // 期待する結果
    const errorName = "DomainError";
    const errorMessage = "テストドメインエラー";
    
    // 操作
    const error = new DomainError(errorMessage);
    
    // アサーション
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(DomainError);
    expect(error.name).toBe(errorName);
    expect(error.message).toBe(errorMessage);
  });
  
  it("正しい名前とメッセージでApplicationErrorを作成すること", () => {
    // 期待する結果
    const errorName = "ApplicationError";
    const errorMessage = "テストアプリケーションエラー";
    
    // 操作
    const error = new ApplicationError(errorMessage);
    
    // アサーション
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(ApplicationError);
    expect(error.name).toBe(errorName);
    expect(error.message).toBe(errorMessage);
  });
  
  it("正しい名前とメッセージでInfrastructureErrorを作成すること", () => {
    // 期待する結果
    const errorName = "InfrastructureError";
    const errorMessage = "テストインフラストラクチャエラー";
    
    // 操作
    const error = new InfrastructureError(errorMessage);
    
    // アサーション
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(InfrastructureError);
    expect(error.name).toBe(errorName);
    expect(error.message).toBe(errorMessage);
  });
  
  it("正しい名前とメッセージでPresentationErrorを作成すること", () => {
    // 期待する結果
    const errorName = "PresentationError";
    const errorMessage = "テストプレゼンテーションエラー";
    
    // 操作
    const error = new PresentationError(errorMessage);
    
    // アサーション
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(PresentationError);
    expect(error.name).toBe(errorName);
    expect(error.message).toBe(errorMessage);
  });
}); 