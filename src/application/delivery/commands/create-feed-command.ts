/**
 * フィード作成コマンド
 * 新しいフィードを作成するためのコマンド
 */

import { Command } from "../../common/command.ts";
import { Result, ok, err } from "npm:neverthrow";
import { FeedAggregate, createNewFeedAggregate } from "../../../core/delivery/aggregates/feed-aggregate.ts";
import { FeedRepository } from "../repositories/feed-repository.ts";
import { FeedMetadataProps } from "../../../core/delivery/value-objects/feed-metadata.ts";

/**
 * フィード作成コマンド
 */
export interface CreateFeedCommand extends Command {
  readonly name: "CreateFeed";
  readonly userId: string;
  readonly feedName: string;
  readonly description?: string;
  readonly tags?: string[];
  readonly isPublic?: boolean;
}

/**
 * フィード作成コマンドハンドラー
 */
export class CreateFeedCommandHandler {
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
   * @param command フィード作成コマンド
   * @returns 作成されたフィード集約
   */
  async execute(command: CreateFeedCommand): Promise<Result<FeedAggregate, Error>> {
    try {
      // 同じ名前のフィードが存在するか確認
      const existingFeed = await this.feedRepository.findByName(command.userId, command.feedName);
      
      if (existingFeed) {
        return err(new Error(`同じ名前のフィードが既に存在します`));
      }
      
      // メタデータの作成
      const metadataProps: FeedMetadataProps = {
        type: "personal", // デフォルトは個人フィード
        description: command.description,
        language: "ja", // デフォルトは日本語
      };
      
      // フィード集約の作成
      const feedAggregate = createNewFeedAggregate({
        userId: command.userId,
        name: command.feedName,
        metadataProps: metadataProps
      });
      
      // フィードの保存
      const savedFeed = await this.feedRepository.save(feedAggregate);
      
      return ok(savedFeed);
    } catch (error) {
      return err(error instanceof Error ? error : new Error(String(error)));
    }
  }
} 