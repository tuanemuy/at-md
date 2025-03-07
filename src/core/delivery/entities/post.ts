/**
 * 投稿エンティティ
 * コンテンツを配信するための投稿を表します。
 */
import { PublishStatus, createPublishStatus, PublishStatusProps } from "../value-objects/publish-status.ts";
import { InvalidPostStateError } from "../../errors/domain.ts";

/**
 * 投稿エンティティのプロパティ
 */
export interface PostProps {
  /**
   * 投稿ID
   */
  id: string;
  
  /**
   * ユーザーID
   */
  userId: string;
  
  /**
   * コンテンツID
   */
  contentId: string;
  
  /**
   * フィードID
   */
  feedId: string;
  
  /**
   * スラッグ（URLの一部として使用）
   */
  slug: string;
  
  /**
   * 公開状態
   */
  publishStatus: PublishStatus;
  
  /**
   * 作成日時
   */
  createdAt: Date;
  
  /**
   * 更新日時
   */
  updatedAt: Date;
}

/**
 * 投稿エンティティ
 */
export interface Post extends PostProps {
  /**
   * 公開状態を更新する
   * @param statusProps 新しい公開状態のプロパティ
   * @returns 更新された投稿
   */
  updatePublishStatus(statusProps: PublishStatusProps): Post;
  
  /**
   * 投稿を下書きにする
   * @returns 更新された投稿
   */
  makeDraft(): Post;
  
  /**
   * 投稿を公開予定にする
   * @param scheduledAt 公開予定日時
   * @returns 更新された投稿
   */
  schedulePublication(scheduledAt: Date): Post;
  
  /**
   * 投稿を公開する
   * @returns 更新された投稿
   */
  publish(): Post;
  
  /**
   * 投稿をアーカイブする
   * @returns 更新された投稿
   */
  archive(): Post;
  
  /**
   * スラッグを更新する
   * @param slug 新しいスラッグ
   * @returns 更新された投稿
   */
  updateSlug(slug: string): Post;
}

/**
 * 投稿エンティティを作成する
 * @param props 投稿のプロパティ
 * @returns 投稿エンティティ
 * @throws {Error} 無効な投稿の場合
 */
export function createPost(props: PostProps): Post {
  // バリデーション
  validatePost(props);
  
  // 投稿オブジェクトを作成
  const post: Post = {
    ...props,
    
    updatePublishStatus(statusProps: PublishStatusProps): Post {
      return createPost({
        ...this,
        publishStatus: createPublishStatus(statusProps),
        updatedAt: new Date()
      });
    },
    
    makeDraft(): Post {
      return createPost({
        ...this,
        publishStatus: createPublishStatus({
          type: "draft"
        }),
        updatedAt: new Date()
      });
    },
    
    schedulePublication(scheduledAt: Date): Post {
      return createPost({
        ...this,
        publishStatus: createPublishStatus({
          type: "scheduled",
          scheduledAt
        }),
        updatedAt: new Date()
      });
    },
    
    publish(): Post {
      return createPost({
        ...this,
        publishStatus: createPublishStatus({
          type: "published",
          publishedAt: new Date()
        }),
        updatedAt: new Date()
      });
    },
    
    archive(): Post {
      return createPost({
        ...this,
        publishStatus: createPublishStatus({
          type: "archived",
          archivedAt: new Date()
        }),
        updatedAt: new Date()
      });
    },
    
    updateSlug(slug: string): Post {
      if (!slug) {
        throw new InvalidPostStateError("空のスラッグ", "スラッグの更新");
      }
      
      return createPost({
        ...this,
        slug,
        updatedAt: new Date()
      });
    }
  };
  
  // 不変オブジェクトとして返す
  return Object.freeze(post);
}

/**
 * 投稿のバリデーション
 * @param props 投稿のプロパティ
 * @throws {Error} 無効な投稿の場合
 */
function validatePost(props: PostProps): void {
  // IDが必須
  if (!props.id) {
    throw new InvalidPostStateError("無効な状態", "投稿IDが指定されていません");
  }
  
  // ユーザーIDが必須
  if (!props.userId) {
    throw new InvalidPostStateError("無効な状態", "ユーザーIDが指定されていません");
  }
  
  // コンテンツIDが必須
  if (!props.contentId) {
    throw new InvalidPostStateError("無効な状態", "コンテンツIDが指定されていません");
  }
  
  // フィードIDが必須
  if (!props.feedId) {
    throw new InvalidPostStateError("無効な状態", "フィードIDが指定されていません");
  }
  
  // スラッグが必須
  if (!props.slug) {
    throw new InvalidPostStateError("無効な状態", "スラッグが指定されていません");
  }
  
  // 公開状態が必須
  if (!props.publishStatus) {
    throw new InvalidPostStateError("無効な状態", "公開状態が指定されていません");
  }
} 