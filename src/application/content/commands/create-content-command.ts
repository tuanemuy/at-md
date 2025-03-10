/**
 * コンテンツ作成コマンド
 * 新しいコンテンツを作成するためのコマンド
 */

import { Command } from "../../common/command.ts";
import { Result, ok, err } from "../deps.ts";
import { ContentAggregate, createContentAggregate } from "../../../core/content/aggregates/content-aggregate.ts";
import { ContentRepository } from "../repositories/content-repository.ts";
import { RepositoryRepository } from "../repositories/repository-repository.ts";
import { createContentMetadata } from "../../../core/content/value-objects/content-metadata.ts";
import { createContent, generateContentId } from "../../../core/content/entities/content.ts";
import { generateId } from "../../../core/common/id.ts";

/**
 * コンテンツ作成コマンド
 */
export interface CreateContentCommand extends Command {
  readonly name: "CreateContent";
  readonly userId: string;
  readonly repositoryId: string;
  readonly path: string;
  readonly title: string;
  readonly body: string;
  readonly metadata?: {
    tags?: string[];
    categories?: string[];
    language?: string;
  };
}

/**
 * コンテンツ作成コマンドハンドラー
 */
export class CreateContentCommandHandler {
  private contentRepository: ContentRepository;
  private repositoryRepository: RepositoryRepository;
  
  /**
   * コンストラクタ
   * @param contentRepository コンテンツリポジトリ
   * @param repositoryRepository リポジトリリポジトリ
   */
  constructor(
    contentRepository: ContentRepository,
    repositoryRepository: RepositoryRepository
  ) {
    this.contentRepository = contentRepository;
    this.repositoryRepository = repositoryRepository;
  }
  
  /**
   * コマンドを実行する
   * @param command コンテンツ作成コマンド
   * @returns 作成されたコンテンツ集約
   */
  async execute(command: CreateContentCommand): Promise<Result<ContentAggregate, Error>> {
    try {
      // リポジトリの存在確認
      const repository = await this.repositoryRepository.findById(command.repositoryId);
      if (!repository) {
        return err(new Error(`リポジトリが見つかりません: ${command.repositoryId}`));
      }
      
      // 同じパスのコンテンツが既に存在するか確認
      const existingContent = await this.contentRepository.findByRepositoryIdAndPath(command.repositoryId, command.path);
      
      if (existingContent) {
        return err(new Error(`指定されたパスにコンテンツが既に存在します: ${command.path}`));
      }
      
      // メタデータの作成
      const metadata = createContentMetadata({
        tags: command.metadata?.tags || [],
        categories: command.metadata?.categories || [],
        language: command.metadata?.language || "ja"
      });
      
      // コンテンツIDの生成
      const contentIdResult = generateContentId();
      if (contentIdResult.isErr()) {
        return err(new Error(`コンテンツIDの生成に失敗しました: ${contentIdResult.error.message}`));
      }
      const contentId = contentIdResult._unsafeUnwrap();
      
      // コンテンツエンティティの作成
      const content = createContent({
        id: contentId,
        userId: command.userId,
        repositoryId: command.repositoryId,
        path: command.path,
        title: command.title,
        body: command.body,
        metadata,
        visibility: "private", // デフォルトは非公開
        versions: [],
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      // コンテンツ集約の作成
      const contentAggregate = createContentAggregate(content);
      
      // コンテンツの保存
      const savedContent = await this.contentRepository.save(contentAggregate);
      
      return ok(savedContent);
    } catch (error) {
      return err(error instanceof Error ? error : new Error(String(error)));
    }
  }
} 