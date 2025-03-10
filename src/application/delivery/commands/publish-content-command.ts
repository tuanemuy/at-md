/**
 * コンテンツ公開コマンド
 * コンテンツを公開するためのコマンド
 */

import { Command } from "../../common/command.ts";
import { Result, ok, err } from "npm:neverthrow";
import { PostAggregate, createNewPostAggregate } from "../../../core/delivery/aggregates/post-aggregate.ts";
import { PostRepository } from "../repositories/post-repository.ts";
import { ContentRepository } from "../../content/repositories/content-repository.ts";
import { generateId } from "../../../core/common/id.ts";

/**
 * コンテンツ公開コマンド
 */
export interface PublishContentCommand extends Command {
  readonly name: "PublishContent";
  readonly contentId: string;
  readonly userId: string;
  readonly feedId?: string;
}

/**
 * コンテンツ公開コマンドハンドラー
 */
export class PublishContentCommandHandler {
  private postRepository: PostRepository;
  private contentRepository: ContentRepository;
  
  /**
   * コンストラクタ
   * @param postRepository ポストリポジトリ
   * @param contentRepository コンテンツリポジトリ
   */
  constructor(
    postRepository: PostRepository,
    contentRepository: ContentRepository
  ) {
    this.postRepository = postRepository;
    this.contentRepository = contentRepository;
  }
  
  /**
   * コマンドを実行する
   * @param command コンテンツ公開コマンド
   * @returns 公開されたポスト集約
   */
  async execute(command: PublishContentCommand): Promise<Result<PostAggregate, Error>> {
    try {
      // コンテンツの存在確認
      const content = await this.contentRepository.findById(command.contentId);
      if (!content) {
        return err(new Error(`コンテンツが見つかりません: ${command.contentId}`));
      }
      
      // 既存のポストを確認
      const existingPost = await this.postRepository.findByContentId(command.contentId);
      
      let postAggregate: PostAggregate;
      
      if (existingPost) {
        // 既存のポストを更新
        postAggregate = existingPost.publish();
      } else {
        // スラッグを生成
        const slug = this.generateSlug(content.content.title);
        if (!slug) {
          return err(new Error("スラッグを生成できませんでした。タイトルが空または無効です。"));
        }
        
        // 新しいポストを作成
        postAggregate = createNewPostAggregate({
          userId: command.userId,
          contentId: command.contentId,
          feedId: command.feedId || generateId(), // フィードIDが指定されていない場合は新しいIDを生成
          slug: slug
        });
        
        // ポストを公開状態にする
        postAggregate = postAggregate.publish();
      }
      
      // ポストを保存
      const savedPost = await this.postRepository.save(postAggregate);
      
      return ok(savedPost);
    } catch (error) {
      return err(error instanceof Error ? error : new Error(String(error)));
    }
  }
  
  /**
   * タイトルからスラッグを生成する
   * @param title タイトル
   * @returns スラッグ
   */
  private generateSlug(title: string): string {
    if (!title || title.trim() === "") {
      return "untitled"; // タイトルが空の場合はデフォルト値を使用
    }
    
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    
    // スラッグが空になった場合（特殊文字のみの場合など）
    return slug || "untitled";
  }
} 