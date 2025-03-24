import {
  type Result,
  ResultAsync,
  err,
  fromPromise,
  fromThrowable,
  ok,
} from "neverthrow";

/**
 * 基本のResult型とその関連機能のエクスポート
 * アプリケーション全体で使用するエラー処理パターン
 */

// 型のエクスポート
export type { Result, ResultAsync };

// 基本関数のエクスポート
export { ok, err, fromPromise, fromThrowable };

/**
 * 複数のResultを並列で実行し、全て成功した場合のみ成功結果（配列）を返す
 * 一つでも失敗した場合は最初の失敗結果を返す
 * @param results Result配列
 */
export function combine<T, E>(results: Result<T, E>[]): Result<T[], E> {
  return results.reduce(
    (acc: Result<T[], E>, result) =>
      acc.isOk()
        ? result.isOk()
          ? ok([...acc.unwrapOr([]), result.unwrapOr(null as unknown as T)])
          : err(result.error)
        : acc,
    ok<T[], E>([]),
  );
}

/**
 * 複数のResultAsyncを並列で実行し、全て成功した場合のみ成功結果（配列）を返す
 * 一つでも失敗した場合は最初の失敗結果を返す
 * @param results ResultAsync配列
 */
export function combineAsync<T, E>(
  results: ResultAsync<T, E>[],
): ResultAsync<T[], E> {
  return ResultAsync.combine(results);
}
