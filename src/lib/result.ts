import { Result, ResultAsync, ok, err, okAsync, errAsync } from "neverthrow";
import { logger } from "./logger";
import type { AnyError } from "@/domain/shared/models/common";

/**
 * 非同期処理をResultAsync型でラップする
 * @param promise 非同期処理
 * @param errorMapper エラーマッピング関数
 * @returns ResultAsync型でラップされた結果
 */
export function wrapAsync<T, E extends AnyError>(
  promise: Promise<T>,
  errorMapper: (error: unknown) => E,
): ResultAsync<T, E> {
  return ResultAsync.fromPromise(promise, (error) => {
    const mappedError = errorMapper(error);
    logger.error(`Error occurred: ${mappedError.message}`, mappedError);
    return mappedError;
  });
}

/**
 * 同期処理をResult型でラップする
 * @param fn 同期処理
 * @param errorMapper エラーマッピング関数
 * @returns Result型でラップされた結果
 */
export function wrapSync<T, E extends AnyError>(
  fn: () => T,
  errorMapper: (error: unknown) => E,
): Result<T, E> {
  try {
    const result = fn();
    return ok(result);
  } catch (error) {
    const mappedError = errorMapper(error);
    logger.error(`Error occurred: ${mappedError.message}`, mappedError);
    return err(mappedError);
  }
}

/**
 * 複数のResult型を並列処理する
 * すべての処理が成功した場合のみ成功結果を返す
 * @param results Result型の配列
 * @returns 結果の配列
 */
export function combineResults<T, E extends AnyError>(
  results: Result<T, E>[],
): Result<T[], E> {
  return Result.combine(results);
}

/**
 * 複数のResultAsync型を並列処理する
 * すべての処理が成功した場合のみ成功結果を返す
 * @param results ResultAsync型の配列
 * @returns 結果の配列を含むResultAsync
 */
export function combineResultsAsync<T, E extends AnyError>(
  results: ResultAsync<T, E>[],
): ResultAsync<T[], E> {
  return ResultAsync.combine(results);
}

// neverthrowのユーティリティ関数をエクスポート
export { ok, err, okAsync, errAsync };
export type { Result, ResultAsync };
