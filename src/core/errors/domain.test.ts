import { expect } from "@std/expect";
import { describe, it } from "@std/testing/bdd";
import { DomainError } from "./base.ts";
import {
  InvalidContentStateError,
  InvalidMetadataError,
  InvalidRepositoryStateError,
  InvalidPostStateError
} from "./domain.ts";

describe("ドメインエラー", () => {
  it("正しい名前とメッセージでInvalidContentStateErrorを作成すること", () => {
    // 期待する結果
    const currentState = "published";
    const attemptedOperation = "publish";
    const expectedMessage = `Cannot perform ${attemptedOperation} on content in ${currentState} state`;
    
    // 操作
    const error = new InvalidContentStateError(currentState, attemptedOperation);
    
    // アサーション
    expect(error).toBeInstanceOf(DomainError);
    expect(error).toBeInstanceOf(InvalidContentStateError);
    expect(error.name).toBe("InvalidContentStateError");
    expect(error.message).toBe(expectedMessage);
  });
  
  it("正しい名前とメッセージでInvalidMetadataErrorを作成すること", () => {
    // 期待する結果
    const errorMessage = "Invalid tags format";
    
    // 操作
    const error = new InvalidMetadataError(errorMessage);
    
    // アサーション
    expect(error).toBeInstanceOf(DomainError);
    expect(error).toBeInstanceOf(InvalidMetadataError);
    expect(error.name).toBe("InvalidMetadataError");
    expect(error.message).toBe(errorMessage);
  });
  
  it("正しい名前とメッセージでInvalidRepositoryStateErrorを作成すること", () => {
    // 期待する結果
    const currentState = "syncing";
    const attemptedOperation = "sync";
    const expectedMessage = `Cannot perform ${attemptedOperation} on repository in ${currentState} state`;
    
    // 操作
    const error = new InvalidRepositoryStateError(currentState, attemptedOperation);
    
    // アサーション
    expect(error).toBeInstanceOf(DomainError);
    expect(error).toBeInstanceOf(InvalidRepositoryStateError);
    expect(error.name).toBe("InvalidRepositoryStateError");
    expect(error.message).toBe(expectedMessage);
  });
  
  it("正しい名前とメッセージでInvalidPostStateErrorを作成すること", () => {
    // 期待する結果
    const currentState = "published";
    const attemptedOperation = "publish";
    const expectedMessage = `Cannot perform ${attemptedOperation} on post in ${currentState} state`;
    
    // 操作
    const error = new InvalidPostStateError(currentState, attemptedOperation);
    
    // アサーション
    expect(error).toBeInstanceOf(DomainError);
    expect(error).toBeInstanceOf(InvalidPostStateError);
    expect(error.name).toBe("InvalidPostStateError");
    expect(error.message).toBe(expectedMessage);
  });
}); 