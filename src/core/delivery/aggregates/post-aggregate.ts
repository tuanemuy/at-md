/**
 * 投稿集約
 * 投稿の高レベル操作を提供します。
 */
import { Post, createPost, PostProps } from "../entities/post.ts";
import { PublishStatusProps } from "../value-objects/publish-status.ts";
import { generateId } from "../../common/id.ts";
import { InvalidPostStateError } from "../../errors/domain.ts";

/**
 * 投稿集約のプロパティ
 */
export interface PostAggregateProps {
  /**
   * 投稿エンティティ
   */
  post: Post;
}

/**
 * 投稿集約
 */
export interface PostAggregate extends PostAggregateProps {
  /**
   * 投稿を下書きとして保存する
   * @returns 更新された投稿集約
   */
  saveDraft(): PostAggregate;
  
  /**
   * 投稿を公開予定として設定する
   * @param scheduledAt 公開予定日時
   * @returns 更新された投稿集約
   */
  schedulePublication(scheduledAt: Date): PostAggregate;
  
  /**
   * 投稿を即時公開する
   * @returns 更新された投稿集約
   */
  publish(): PostAggregate;
  
  /**
   * 投稿をアーカイブする
   * @returns 更新された投稿集約
   */
  archive(): PostAggregate;
  
  /**
   * 投稿のスラッグを更新する
   * @param slug 新しいスラッグ
   * @returns 更新された投稿集約
   */
  updateSlug(slug: string): PostAggregate;
  
  /**
   * 投稿の公開状態を更新する
   * @param statusProps 新しい公開状態のプロパティ
   * @returns 更新された投稿集約
   */
  updatePublishStatus(statusProps: PublishStatusProps): PostAggregate;
  
  /**
   * 投稿エンティティを取得する
   * @returns 投稿エンティティ
   */
  getPost(): Post;
}

/**
 * 新しい投稿集約を作成するためのパラメータ
 */
export interface CreatePostAggregateParams {
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
}

/**
 * 投稿集約を作成する
 * @param props 投稿集約のプロパティ
 * @returns 投稿集約
 */
export function createPostAggregate(props: PostAggregateProps): PostAggregate {
  // 投稿集約オブジェクトを作成
  const aggregate: PostAggregate = {
    ...props,
    
    saveDraft(): PostAggregate {
      return createPostAggregate({
        post: this.post.makeDraft()
      });
    },
    
    schedulePublication(scheduledAt: Date): PostAggregate {
      return createPostAggregate({
        post: this.post.schedulePublication(scheduledAt)
      });
    },
    
    publish(): PostAggregate {
      return createPostAggregate({
        post: this.post.publish()
      });
    },
    
    archive(): PostAggregate {
      return createPostAggregate({
        post: this.post.archive()
      });
    },
    
    updateSlug(slug: string): PostAggregate {
      return createPostAggregate({
        post: this.post.updateSlug(slug)
      });
    },
    
    updatePublishStatus(statusProps: PublishStatusProps): PostAggregate {
      return createPostAggregate({
        post: this.post.updatePublishStatus(statusProps)
      });
    },
    
    getPost(): Post {
      return this.post;
    }
  };
  
  // 不変オブジェクトとして返す
  return Object.freeze(aggregate);
}

/**
 * 新しい投稿集約を作成する
 * @param params 新しい投稿集約を作成するためのパラメータ
 * @returns 投稿集約
 */
export function createNewPostAggregate(params: CreatePostAggregateParams): PostAggregate {
  // スラッグのバリデーション
  if (!params.slug) {
    throw new InvalidPostStateError("無効な状態", "スラッグが指定されていません");
  }
  
  // 新しい投稿エンティティを作成
  const post = createPost({
    id: generateId(),
    userId: params.userId,
    contentId: params.contentId,
    feedId: params.feedId,
    slug: params.slug,
    publishStatus: {
      type: "draft"
    },
    createdAt: new Date(),
    updatedAt: new Date()
  });
  
  // 投稿集約を作成して返す
  return createPostAggregate({
    post
  });
} 