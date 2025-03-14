import { expect, test } from "vitest";
import { type Result, ok, err, fromPromise } from "../models/result";

test("成功の場合にokを返すこと", () => {
  const result: Result<number, Error> = ok(42);
  
  expect(result.isOk()).toBe(true);
  expect(result.isErr()).toBe(false);
  
  result.map((value) => {
    expect(value).toBe(42);
  });
});

test("失敗の場合にerrを返すこと", () => {
  const error = new Error("テストエラー");
  const result: Result<number, Error> = err(error);
  
  expect(result.isOk()).toBe(false);
  expect(result.isErr()).toBe(true);
  
  result.mapErr((e) => {
    expect(e).toBe(error);
    expect(e.message).toBe("テストエラー");
  });
});

test("Promiseから成功のResultを生成できること", async () => {
  const successPromise = Promise.resolve(42);
  
  const resultPromise = fromPromise(successPromise, (e) => new Error(`エラー: ${e}`));
  const result = await resultPromise;
  
  expect(result.isOk()).toBe(true);
  result.map((value) => {
    expect(value).toBe(42);
  });
});

test("Promiseから失敗のResultを生成できること", async () => {
  const failurePromise = Promise.reject("失敗");
  
  const resultPromise = fromPromise(failurePromise, (e) => new Error(`エラー: ${e}`));
  const result = await resultPromise;
  
  expect(result.isErr()).toBe(true);
  result.mapErr((error) => {
    expect(error.message).toBe("エラー: 失敗");
  });
}); 