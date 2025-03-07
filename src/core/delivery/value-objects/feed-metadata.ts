/**
 * フィードのメタデータを表す値オブジェクト
 */

/**
 * フィードの種類
 * - personal: 個人フィード（単一ユーザーの投稿）
 * - collection: コレクションフィード（特定のテーマやトピックに関連する投稿のコレクション）
 * - tag: タグフィード（特定のタグに関連する投稿）
 */
export type FeedType = "personal" | "collection" | "tag";

/**
 * フィードのメタデータのプロパティ
 */
export interface FeedMetadataProps {
  /**
   * フィードの種類
   */
  type: FeedType;
  
  /**
   * フィードの説明
   */
  description?: string;
  
  /**
   * フィードのアイコンURL
   */
  iconUrl?: string;
  
  /**
   * フィードのカバー画像URL
   */
  coverImageUrl?: string;
  
  /**
   * フィードの言語
   */
  language: string;
  
  /**
   * フィードのカスタムドメイン
   */
  customDomain?: string;
  
  /**
   * フィードのカスタムスラッグ
   */
  customSlug?: string;
  
  /**
   * フィードのカスタムテーマ
   */
  customTheme?: string;
  
  /**
   * フィードのカスタムCSS
   */
  customCss?: string;
  
  /**
   * フィードのカスタムJavaScript
   */
  customJs?: string;
  
  /**
   * フィードのカスタムヘッダー
   */
  customHeader?: string;
  
  /**
   * フィードのカスタムフッター
   */
  customFooter?: string;
}

/**
 * フィードのメタデータの値オブジェクト
 */
export interface FeedMetadata extends FeedMetadataProps {
  readonly [key: string]: any;
}

/**
 * フィードのメタデータの値オブジェクトを作成する
 * @param props フィードのメタデータのプロパティ
 * @returns フィードのメタデータの値オブジェクト
 * @throws {Error} 無効なフィードのメタデータの場合
 */
export function createFeedMetadata(props: FeedMetadataProps): FeedMetadata {
  // バリデーション
  validateFeedMetadata(props);
  
  // 不変オブジェクトとして返す
  return Object.freeze({ ...props });
}

/**
 * フィードのメタデータのバリデーション
 * @param props フィードのメタデータのプロパティ
 * @throws {Error} 無効なフィードのメタデータの場合
 */
function validateFeedMetadata(props: FeedMetadataProps): void {
  // フィードの種類が必須
  if (!props.type) {
    throw new Error("フィードの種類は必須です");
  }
  
  // フィードの種類が有効な値であることを確認
  if (!["personal", "collection", "tag"].includes(props.type)) {
    throw new Error(`無効なフィードの種類です: ${props.type}`);
  }
  
  // 言語が必須
  if (!props.language) {
    throw new Error("言語は必須です");
  }
} 