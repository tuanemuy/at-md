/**
 * フィード削除コマンド
 * 既存のフィードを削除するためのコマンド
 */

import { Command } from "../../common/mod.ts";
import { Result, ok, err } from "../deps.ts";
import { FeedRepository } from "../repositories/feed-repository.ts";

/**
 * フィード削除コマンド
 */
export interface DeleteFeedCommand extends Command {
  readonly name: "DeleteFeed";
  readonly feedId: string;
  readonly userId: string;
}

/**
 * フィード削除コマンドハンドラー
 */
export class DeleteFeedCommandHandler {
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
   * @param command フィード削除コマンド
   * @returns 削除が成功したかどうか
   */
  async execute(command: DeleteFeedCommand): Promise<Result<boolean, Error>> {
    try {
      // フィードを取得
      const feedAggregate = await this.feedRepository.findById(command.feedId);
      
      if (!feedAggregate) {
        return err(new Error(`指定されたIDのフィードが見つかりません: ${command.feedId}`));
      }
      
      // ユーザーIDが一致するか確認
      const feed = feedAggregate.getFeed();
      if (feed.userId !== command.userId) {
        return err(new Error("このフィードを削除する権限がありません"));
      }
      
      // フィードの削除
      const result = await this.feedRepository.delete(command.feedId);
      
      return ok(result);
    } catch (error) {
      return err(error instanceof Error ? error : new Error(String(error)));
    }
  }
} 