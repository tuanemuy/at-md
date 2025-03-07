/**
 * 投稿の公開状態を表す値オブジェクト
 */

/**
 * 公開状態の種類
 * - draft: 下書き（未公開）
 * - scheduled: 公開予定（指定した日時に公開）
 * - published: 公開済み
 * - archived: アーカイブ済み（非公開）
 */
export type PublishStatusType = "draft" | "scheduled" | "published" | "archived";

/**
 * 公開状態の値オブジェクトのプロパティ
 */
export interface PublishStatusProps {
  /**
   * 公開状態の種類
   */
  type: PublishStatusType;
  
  /**
   * 公開予定日時（scheduledの場合のみ使用）
   */
  scheduledAt?: Date;
  
  /**
   * 公開日時（publishedの場合のみ使用）
   */
  publishedAt?: Date;
  
  /**
   * アーカイブ日時（archivedの場合のみ使用）
   */
  archivedAt?: Date;
}

/**
 * 公開状態の値オブジェクト
 */
export interface PublishStatus extends PublishStatusProps {
  readonly [key: string]: any;
}

/**
 * 公開状態の値オブジェクトを作成する
 * @param props 公開状態のプロパティ
 * @returns 公開状態の値オブジェクト
 * @throws {Error} 無効な公開状態の場合
 */
export function createPublishStatus(props: PublishStatusProps): PublishStatus {
  // バリデーション
  validatePublishStatus(props);
  
  // 不変オブジェクトとして返す
  return Object.freeze({ ...props });
}

/**
 * 公開状態のバリデーション
 * @param props 公開状態のプロパティ
 * @throws {Error} 無効な公開状態の場合
 */
function validatePublishStatus(props: PublishStatusProps): void {
  // 公開状態の種類が必須
  if (!props.type) {
    throw new Error("公開状態の種類は必須です");
  }
  
  // 公開状態の種類が有効な値であることを確認
  if (!["draft", "scheduled", "published", "archived"].includes(props.type)) {
    throw new Error(`無効な公開状態です: ${props.type}`);
  }
  
  // 公開予定の場合は公開予定日時が必須
  if (props.type === "scheduled" && !props.scheduledAt) {
    throw new Error("公開予定の場合は公開予定日時が必須です");
  }
  
  // 公開済みの場合は公開日時が必須
  if (props.type === "published" && !props.publishedAt) {
    throw new Error("公開済みの場合は公開日時が必須です");
  }
  
  // アーカイブ済みの場合はアーカイブ日時が必須
  if (props.type === "archived" && !props.archivedAt) {
    throw new Error("アーカイブ済みの場合はアーカイブ日時が必須です");
  }
} 