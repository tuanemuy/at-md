/**
 * 配信サービス
 * 投稿の公開管理、スケジューリングなどの機能を提供します。
 */
import { Post } from "../entities/post.ts";
import { Feed } from "../entities/feed.ts";
import { PostAggregate, createPostAggregate } from "../aggregates/post-aggregate.ts";
import { FeedAggregate, createFeedAggregate } from "../aggregates/feed-aggregate.ts";
import { InvalidPostStateError } from "../../errors/domain.ts";

/**
 * 配信サービス
 */
export class PublishingService {
  /**
   * 投稿を公開する
   * @param postAggregate 投稿集約
   * @returns 更新された投稿集約
   */
  publishPost(postAggregate: PostAggregate): PostAggregate {
    return postAggregate.publish();
  }
  
  /**
   * 投稿を公開予定として設定する
   * @param postAggregate 投稿集約
   * @param scheduledAt 公開予定日時
   * @returns 更新された投稿集約
   */
  schedulePost(postAggregate: PostAggregate, scheduledAt: Date): PostAggregate {
    // 過去の日時を指定した場合はエラー
    const now = new Date();
    if (scheduledAt <= now) {
      throw new InvalidPostStateError("無効な公開予定日時", "過去の日時は指定できません");
    }
    
    return postAggregate.schedulePublication(scheduledAt);
  }
  
  /**
   * 投稿を下書きに戻す
   * @param postAggregate 投稿集約
   * @returns 更新された投稿集約
   */
  unpublishPost(postAggregate: PostAggregate): PostAggregate {
    return postAggregate.saveDraft();
  }
  
  /**
   * 投稿をアーカイブする
   * @param postAggregate 投稿集約
   * @returns 更新された投稿集約
   */
  archivePost(postAggregate: PostAggregate): PostAggregate {
    return postAggregate.archive();
  }
  
  /**
   * フィードに投稿を追加する
   * @param feedAggregate フィード集約
   * @param postAggregate 投稿集約
   * @returns 更新されたフィード集約
   */
  addPostToFeed(feedAggregate: FeedAggregate, postAggregate: PostAggregate): FeedAggregate {
    const post = postAggregate.getPost();
    return feedAggregate.addPost(post.id);
  }
  
  /**
   * フィードから投稿を削除する
   * @param feedAggregate フィード集約
   * @param postAggregate 投稿集約
   * @returns 更新されたフィード集約
   */
  removePostFromFeed(feedAggregate: FeedAggregate, postAggregate: PostAggregate): FeedAggregate {
    const post = postAggregate.getPost();
    return feedAggregate.removePost(post.id);
  }
  
  /**
   * フィードの投稿を並べ替える
   * @param feedAggregate フィード集約
   * @param postAggregates 並べ替え後の投稿集約のリスト
   * @returns 更新されたフィード集約
   */
  reorderFeedPosts(feedAggregate: FeedAggregate, postAggregates: PostAggregate[]): FeedAggregate {
    const postIds = postAggregates.map(aggregate => aggregate.getPost().id);
    return feedAggregate.reorderPosts(postIds);
  }
  
  /**
   * 公開予定の投稿を処理する
   * 現在時刻が公開予定日時を過ぎている場合、投稿を公開する
   * @param postAggregate 投稿集約
   * @returns 更新された投稿集約（公開された場合）または元の投稿集約（公開されなかった場合）
   */
  processScheduledPost(postAggregate: PostAggregate): PostAggregate {
    const post = postAggregate.getPost();
    
    // 公開予定でない場合は何もしない
    if (post.publishStatus.type !== "scheduled") {
      return postAggregate;
    }
    
    // 公開予定日時が設定されていない場合は何もしない
    if (!post.publishStatus.scheduledAt) {
      return postAggregate;
    }
    
    // 現在時刻が公開予定日時を過ぎている場合、投稿を公開する
    const now = new Date();
    if (post.publishStatus.scheduledAt <= now) {
      return postAggregate.publish();
    }
    
    // 公開予定日時が未来の場合は何もしない
    return postAggregate;
  }
  
  /**
   * 複数の公開予定投稿を処理する
   * @param postAggregates 投稿集約のリスト
   * @returns 更新された投稿集約のリスト
   */
  processScheduledPosts(postAggregates: PostAggregate[]): PostAggregate[] {
    return postAggregates.map(aggregate => this.processScheduledPost(aggregate));
  }
} 