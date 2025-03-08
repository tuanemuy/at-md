/**
 * フィード更新コマンド
 * 既存のフィードを更新するためのコマンド
 */

import { Command } from "../../common/command.ts";
import { Result, ok, err } from "npm:neverthrow";
import { FeedAggregate } from "../../../core/delivery/aggregates/feed-aggregate.ts";
import { FeedRepository } from "../repositories/feed-repository.ts";
import { FeedMetadataProps } from "../../../core/delivery/value-objects/feed-metadata.ts";

/**
 * フィード更新コマンド
 */
export interface UpdateFeedCommand extends Command {
  readonly name: "UpdateFeed";
  readonly feedId: string;
  readonly userId: string;
  readonly feedName?: string;
  readonly description?: string;
  readonly tags?: string[];
  readonly isPublic?: boolean;
}

/**
 * フィード更新コマンドハンドラー
 */
export class UpdateFeedCommandHandler {
  private feedRepository: FeedRepository;
  
  /**
   * コンストラクタ
   * @param feedRepository フィードリポジトリ
   */
  constructor(feedRepository: FeedRepository) {
    this.feedRepository = feedRepository;
  }
  
  /**
   * コマンドを実行する
   * @param command フィード更新コマンド
   * @returns 更新されたフィード集約
   */
  async execute(command: UpdateFeedCommand): Promise<Result<FeedAggregate, Error>> {
    try {
      // フィードを取得
      const feedAggregate = await this.feedRepository.findById(command.feedId);
      
      if (!feedAggregate) {
        return err(new Error(`指定されたIDのフィードが見つかりません: ${command.feedId}`));
      }
      
      // ユーザーIDが一致するか確認
      const feed = feedAggregate.getFeed();
      if (feed.userId !== command.userId) {
        return err(new Error("このフィードを更新する権限がありません"));
      }
      
      // フィード名の更新
      let updatedFeedAggregate = feedAggregate;
      if (command.feedName && command.feedName !== feed.name) {
        // 同じ名前のフィードが存在するか確認
        const existingFeed = await this.feedRepository.findByName(command.userId, command.feedName);
        if (existingFeed && existingFeed.getFeed().id !== command.feedId) {
          return err(new Error(`同じ名前のフィードが既に存在します: ${command.feedName}`));
        }
        
        updatedFeedAggregate = updatedFeedAggregate.updateName(command.feedName);
      }
      
      // メタデータの更新
      if (command.description !== undefined || command.tags !== undefined || command.isPublic !== undefined) {
        const currentMetadata = feed.metadata;
        const metadataProps: FeedMetadataProps = {
          type: currentMetadata.type,
          description: command.description !== undefined ? command.description : currentMetadata.description,
          language: currentMetadata.language,
        };
        
        updatedFeedAggregate = updatedFeedAggregate.updateMetadata(metadataProps);
      }
      
      // フィードの保存
      const savedFeed = await this.feedRepository.save(updatedFeedAggregate);
      
      return ok(savedFeed);
    } catch (error) {
      return err(error instanceof Error ? error : new Error(String(error)));
    }
  }
} 