import { expect } from "@std/expect";
import { describe, it } from "@std/testing/bdd";
import { Result, ok, err } from "neverthrow";
import { DomainError } from "./base.ts";
import { InvalidContentStateError } from "./domain.ts";

// 成功時にokを返す関数
function successFunction(): Result<string, DomainError> {
  return ok("success");
}

// 失敗時にerrを返す関数
function failureFunction(): Result<string, DomainError> {
  return err(new InvalidContentStateError("draft", "publish"));
}

describe("Result型", () => {
  it("成功ケースが正しく処理されること", () => {
    // 期待する結果
    const expectedValue = "success";
    
    // 操作
    const result = successFunction();
    
    // アサーション
    expect(result.isOk()).toBe(true);
    expect(result.isErr()).toBe(false);
    
    // mapメソッドで値を取得
    result.map((value) => {
      expect(value).toBe(expectedValue);
    });
    
    // unwrapOrElseで値を取得
    const value = result.unwrapOr("default");
    expect(value).toBe(expectedValue);
  });
  
  it("失敗ケースが正しく処理されること", () => {
    // 期待する結果
    const expectedErrorName = "InvalidContentStateError";
    const expectedErrorMessage = "Cannot perform publish on content in draft state";
    
    // 操作
    const result = failureFunction();
    
    // アサーション
    expect(result.isOk()).toBe(false);
    expect(result.isErr()).toBe(true);
    
    // mapErrメソッドでエラーを取得
    result.mapErr((error) => {
      expect(error).toBeInstanceOf(DomainError);
      expect(error).toBeInstanceOf(InvalidContentStateError);
      expect(error.name).toBe(expectedErrorName);
      expect(error.message).toBe(expectedErrorMessage);
    });
    
    // unwrapOrElseでデフォルト値を取得
    const value = result.unwrapOr("default");
    expect(value).toBe("default");
  });
  
  it("チェーン処理が正しく動作すること", () => {
    // 期待する結果
    const expectedValue = "SUCCESS";
    
    // 操作: 成功ケースをチェーン
    const result = successFunction()
      .map((value) => value.toUpperCase());
    
    // アサーション
    expect(result.isOk()).toBe(true);
    result.map((value) => {
      expect(value).toBe(expectedValue);
    });
    
    // 操作: 失敗ケースをチェーン（実行されない）
    const failureResult = failureFunction()
      .map((value) => value.toUpperCase());
    
    // アサーション
    expect(failureResult.isErr()).toBe(true);
  });
}); 