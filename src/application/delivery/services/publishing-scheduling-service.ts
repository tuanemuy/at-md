/**
 * 配信スケジューリングサービス
 * 投稿の公開スケジュールを管理するサービス
 */

import { Result, ok, err } from "npm:neverthrow";
import { PostAggregate } from "../../../core/delivery/aggregates/post-aggregate.ts";
import { PostRepository } from "../repositories/post-repository.ts";

/**
 * 配信スケジューリングサービスインターフェース
 */
export interface PublishingSchedulingService {
  /**
   * 指定された日時に公開予定の投稿を取得する
   * @param date 対象日時
   * @returns 公開予定の投稿集約の配列
   */
  getScheduledPosts(date: Date): Promise<Result<PostAggregate[], Error>>;
  
  /**
   * 公開予定の投稿を公開する
   * @param postId 投稿ID
   * @returns 公開された投稿集約
   */
  publishScheduledPost(postId: string): Promise<Result<PostAggregate, Error>>;
  
  /**
   * 公開予定の投稿を一括で公開する
   * @param date 対象日時
   * @returns 公開された投稿集約の配列
   */
  publishScheduledPostsByDate(date: Date): Promise<Result<PostAggregate[], Error>>;
}

/**
 * 配信スケジューリングサービス実装
 */
export class DefaultPublishingSchedulingService implements PublishingSchedulingService {
  private postRepository: PostRepository;
  
  /**
   * コンストラクタ
   * @param postRepository 投稿リポジトリ
   */
  constructor(postRepository: PostRepository) {
    this.postRepository = postRepository;
  }
  
  /**
   * 指定された日時に公開予定の投稿を取得する
   * @param date 対象日時
   * @returns 公開予定の投稿集約の配列
   */
  async getScheduledPosts(date: Date): Promise<Result<PostAggregate[], Error>> {
    try {
      // 指定された日時以前に公開予定の投稿を取得
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      
      // 実際の実装では、リポジトリに日付範囲で検索するメソッドを追加する必要があります
      // ここでは簡易的な実装として、すべての投稿を取得してフィルタリングします
      const allPosts = await this.postRepository.findByUserId("", { status: "scheduled" });
      
      const scheduledPosts = allPosts.filter(post => {
        const publishStatus = post.getPost().publishStatus;
        if (publishStatus.type === "scheduled" && publishStatus.scheduledAt) {
          return publishStatus.scheduledAt >= startOfDay && publishStatus.scheduledAt <= endOfDay;
        }
        return false;
      });
      
      return ok(scheduledPosts);
    } catch (error) {
      return err(error instanceof Error ? error : new Error(String(error)));
    }
  }
  
  /**
   * 公開予定の投稿を公開する
   * @param postId 投稿ID
   * @returns 公開された投稿集約
   */
  async publishScheduledPost(postId: string): Promise<Result<PostAggregate, Error>> {
    try {
      // 投稿を取得
      const post = await this.postRepository.findById(postId);
      
      if (!post) {
        return err(new Error(`投稿が見つかりません: ${postId}`));
      }
      
      // 投稿のステータスを確認
      const publishStatus = post.getPost().publishStatus;
      if (publishStatus.type !== "scheduled") {
        return err(new Error(`投稿は公開予定状態ではありません: ${postId}`));
      }
      
      // 投稿を公開
      const publishedPost = post.publish();
      
      // 保存
      const savedPost = await this.postRepository.save(publishedPost);
      
      return ok(savedPost);
    } catch (error) {
      return err(error instanceof Error ? error : new Error(String(error)));
    }
  }
  
  /**
   * 公開予定の投稿を一括で公開する
   * @param date 対象日時
   * @returns 公開された投稿集約の配列
   */
  async publishScheduledPostsByDate(date: Date): Promise<Result<PostAggregate[], Error>> {
    try {
      // 公開予定の投稿を取得
      const scheduledPostsResult = await this.getScheduledPosts(date);
      
      if (scheduledPostsResult.isErr()) {
        return err(scheduledPostsResult.error);
      }
      
      const scheduledPosts = scheduledPostsResult.value;
      
      // 現在の日時
      const now = new Date();
      
      // 公開予定日時が現在より前の投稿のみを公開
      const postsToPublish = scheduledPosts.filter(post => {
        const publishStatus = post.getPost().publishStatus;
        return publishStatus.type === "scheduled" && 
               publishStatus.scheduledAt && 
               publishStatus.scheduledAt <= now;
      });
      
      // 投稿を公開
      const publishedPosts: PostAggregate[] = [];
      
      for (const post of postsToPublish) {
        const publishResult = await this.publishScheduledPost(post.getPost().id);
        
        if (publishResult.isOk()) {
          publishedPosts.push(publishResult.value);
        }
        // エラーが発生した場合は無視して次の投稿を処理
      }
      
      return ok(publishedPosts);
    } catch (error) {
      return err(error instanceof Error ? error : new Error(String(error)));
    }
  }
} 