import { expect, test, vi } from "vitest";
import {
  wrapAsync,
  wrapSync,
  combineResults,
  combineResultsAsync,
  ok,
  err,
  okAsync,
  errAsync,
  type ResultAsync,
} from "../result";
import type { AnyError } from "@/domain/shared/models/common";

// モックエラーの作成
interface TestError extends AnyError {
  name: string;
  type: string;
  message: string;
}

function createTestError(message: string): TestError {
  return {
    name: "TestError",
    type: "TEST_ERROR",
    message,
  };
}

test("wrapAsync関数が成功した場合にokを返すこと", async () => {
  const promise = Promise.resolve("success");
  const errorMapper = vi.fn((e: unknown) => createTestError("Error occurred"));

  const result = await wrapAsync(promise, errorMapper);

  expect(result.isOk()).toBe(true);
  expect(result.isErr()).toBe(false);
  expect(errorMapper).not.toHaveBeenCalled();
  if (result.isOk()) {
    expect(result.value).toBe("success");
  }
});

test("wrapAsync関数が失敗した場合にerrを返すこと", async () => {
  const originalError = new Error("Original error");
  const promise = Promise.reject(originalError);
  const errorMapper = vi.fn((e: unknown) => createTestError("Mapped error"));

  const result = await wrapAsync(promise, errorMapper);

  expect(result.isOk()).toBe(false);
  expect(result.isErr()).toBe(true);
  expect(errorMapper).toHaveBeenCalledTimes(1);
  expect(errorMapper).toHaveBeenCalledWith(originalError);
  if (result.isErr()) {
    expect(result.error.message).toBe("Mapped error");
  }
});

test("wrapAsync関数がResultAsyncを返すこと", () => {
  const promise = Promise.resolve("success");
  const errorMapper = (e: unknown) => createTestError("Error occurred");

  const result = wrapAsync(promise, errorMapper);

  expect(result).toHaveProperty("_promise");
  expect(result.map).toBeInstanceOf(Function);
  expect(result.mapErr).toBeInstanceOf(Function);
  expect(result.andThen).toBeInstanceOf(Function);
});

test("wrapSync関数が成功した場合にokを返すこと", () => {
  const fn = () => "success";
  const errorMapper = vi.fn((e: unknown) => createTestError("Error occurred"));

  const result = wrapSync(fn, errorMapper);

  expect(result.isOk()).toBe(true);
  expect(result.isErr()).toBe(false);
  expect(errorMapper).not.toHaveBeenCalled();
  if (result.isOk()) {
    expect(result.value).toBe("success");
  }
});

test("wrapSync関数が失敗した場合にerrを返すこと", () => {
  const originalError = new Error("Original error");
  const fn = () => {
    throw originalError;
  };
  const errorMapper = vi.fn((e: unknown) => createTestError("Mapped error"));

  const result = wrapSync(fn, errorMapper);

  expect(result.isOk()).toBe(false);
  expect(result.isErr()).toBe(true);
  expect(errorMapper).toHaveBeenCalledTimes(1);
  expect(errorMapper).toHaveBeenCalledWith(originalError);
  if (result.isErr()) {
    expect(result.error.message).toBe("Mapped error");
  }
});

test("combineResults関数がすべて成功の場合に成功結果を返すこと", () => {
  const results = [ok("result1"), ok("result2"), ok("result3")];

  const combined = combineResults(results);

  expect(combined.isOk()).toBe(true);
  if (combined.isOk()) {
    expect(combined.value).toEqual(["result1", "result2", "result3"]);
  }
});

test("combineResults関数が一つでも失敗の場合に最初のエラーを返すこと", () => {
  const error = createTestError("Test error");
  const results = [ok("result1"), err(error), ok("result3")];

  const combined = combineResults(results);

  expect(combined.isErr()).toBe(true);
  if (combined.isErr()) {
    expect(combined.error).toBe(error);
  }
});

test("combineResultsAsync関数がすべて成功の場合に成功結果を返すこと", async () => {
  const results = [okAsync("result1"), okAsync("result2"), okAsync("result3")];

  const combined = await combineResultsAsync(results);

  expect(combined.isOk()).toBe(true);
  if (combined.isOk()) {
    expect(combined.value).toEqual(["result1", "result2", "result3"]);
  }
});

test("combineResultsAsync関数が一つでも失敗の場合に最初のエラーを返すこと", async () => {
  const error = createTestError("Test error");
  const results = [okAsync("result1"), errAsync(error), okAsync("result3")];

  const combined = await combineResultsAsync(results);

  expect(combined.isErr()).toBe(true);
  if (combined.isErr()) {
    expect(combined.error).toBe(error);
  }
});
