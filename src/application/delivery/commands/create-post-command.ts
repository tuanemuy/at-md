/**
 * 投稿作成コマンド
 * 新しい投稿を作成するためのコマンド
 */

import { Command, CommandHandler } from "../../common/mod.ts";
import { Result, ok, err } from "../deps.ts";
import { 
  PostAggregate, 
  createNewPostAggregate,
  ApplicationError,
  generateId
} from "../deps.ts";
import { PostRepository } from "../repositories/mod.ts";

/**
 * 投稿作成コマンド
 */
export interface CreatePostCommand extends Command {
  readonly name: "CreatePost";
  readonly userId: string;
  readonly contentId: string;
  readonly feedId: string;
  readonly slug: string;
}

/**
 * 投稿作成コマンドハンドラー
 */
export class CreatePostCommandHandler {
  private postRepository: PostRepository;
  
  /**
   * コンストラクタ
   * @param postRepository 投稿リポジトリ
   */
  constructor(postRepository: PostRepository) {
    this.postRepository = postRepository;
  }
  
  /**
   * コマンドを実行する
   * @param command 投稿作成コマンド
   * @returns 作成された投稿集約
   */
  async execute(command: CreatePostCommand): Promise<Result<PostAggregate, Error>> {
    try {
      // 同じコンテンツIDの投稿が存在するか確認
      const existingPost = await this.postRepository.findByContentId(command.contentId);
      
      if (existingPost) {
        return err(new Error(`指定されたコンテンツIDの投稿が既に存在します: ${command.contentId}`));
      }
      
      // 投稿集約の作成
      const postAggregate = createNewPostAggregate({
        userId: command.userId,
        contentId: command.contentId,
        feedId: command.feedId,
        slug: command.slug
      });
      
      // 投稿の保存
      const savedPost = await this.postRepository.save(postAggregate);
      
      return ok(savedPost);
    } catch (error) {
      return err(error instanceof Error ? error : new Error(String(error)));
    }
  }
} 