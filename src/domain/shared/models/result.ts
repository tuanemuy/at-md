/**
 * Result型
 * 
 * neverthrowのResult型をエクスポートします。
 * 成功または失敗を明示的に表現するために使用します。
 */
export { Result, ok, err, ResultAsync } from "neverthrow";

/**
 * 複数のResultを処理するためのユーティリティ関数
 */
export { 
  fromPromise, 
  fromThrowable,
  fromSafePromise
} from "neverthrow"; 