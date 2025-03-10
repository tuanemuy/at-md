/**
 * コンテンツ作成コマンド
 * 新しいコンテンツを作成するためのコマンド
 */

import { Command, CommandHandler } from "../../common/mod.ts";
import { Result, ok, err } from "npm:neverthrow";
import { 
  ContentAggregate, 
  createContentAggregate,
  Content,
  ContentMetadata
} from "../../../core/content/mod.ts";
import { ContentRepository } from "../repositories/mod.ts";
import { RepositoryRepository } from "../repositories/mod.ts";
import { ApplicationError, DomainError } from "../../../core/errors/mod.ts";
import { generateId } from "../../../core/common/mod.ts";
import { 
  createContentMetadata,
  createContent
} from "../../../core/content/mod.ts";

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
      
      // 同じパスのコンテンツが存在するか確認
      const existingContent = await this.contentRepository.findByRepositoryIdAndPath(
        command.repositoryId,
        command.path
      );
      
      if (existingContent) {
        return err(new Error(`指定されたパスにコンテンツが既に存在します: ${command.path}`));
      }
      
      // メタデータの作成
      const metadataResult = createContentMetadata({
        tags: command.metadata?.tags || [],
        categories: command.metadata?.categories || [],
        language: command.metadata?.language || "ja"
      });
      
      if (metadataResult.isErr()) {
        return err(metadataResult.error);
      }
      
      const metadata = metadataResult.value;
      
      // コンテンツエンティティの作成
      const contentResult = createContent({
        id: generateId(),
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
      
      if (contentResult.isErr()) {
        return err(contentResult.error);
      }
      
      const content = contentResult.value;
      
      // コンテンツ集約の作成
      const contentAggregateResult = createContentAggregate(content);
      
      if (contentAggregateResult.isErr()) {
        return err(contentAggregateResult.error);
      }
      
      const contentAggregate = contentAggregateResult.value;
      
      // コンテンツの保存
      const savedContent = await this.contentRepository.save(contentAggregate);
      
      return ok(savedContent);
    } catch (error) {
      return err(error instanceof Error ? error : new Error(String(error)));
    }
  }
} 