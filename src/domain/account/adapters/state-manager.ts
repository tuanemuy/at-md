import type { StateData } from "@/domain/account/models/state-data";
import type { ExternalServiceError } from "@/domain/types/error";
import type { ResultAsync } from "neverthrow";

export interface StateManager<T> {
  /**
   * セッションにデータを保存する
   */
  set(context: T, data: StateData): ResultAsync<void, ExternalServiceError>;

  /**
   * セッションからデータを取得する
   */
  get(context: T): ResultAsync<StateData, ExternalServiceError>;

  /**
   * セッションからデータを削除する
   */
  remove(context: T): ResultAsync<void, ExternalServiceError>;
}
