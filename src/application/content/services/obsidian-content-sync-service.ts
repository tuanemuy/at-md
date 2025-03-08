/**
 * Obsidian用コンテンツ同期サービス
 * Obsidianボールトとのコンテンツ同期を担当するサービス
 */

import { Result, ok, err } from "npm:neverthrow";
import { ContentAggregate } from "../../../core/content/aggregates/content-aggregate.ts";
import { RepositoryAggregate } from "../../../core/content/aggregates/repository-aggregate.ts";
import { ContentSyncService, SyncResult } from "./content-sync-service.ts";
import { ContentRepository } from "../repositories/content-repository.ts";
import { RepositoryRepository } from "../repositories/repository-repository.ts";
import { ObsidianAdapter, ObsidianNote } from "../../../infrastructure/adapters/obsidian/obsidian-adapter.ts";
import { createContent } from "../../../core/content/entities/content.ts";
import { createContentAggregate } from "../../../core/content/aggregates/content-aggregate.ts";
import { createContentMetadata } from "../../../core/content/value-objects/content-metadata.ts";
import { generateId } from "../../../core/common/id.ts";

/**
 * 外部リポジトリ設定
 */
interface ExternalRepositoryConfig {
  type: "github" | "obsidian";
  vaultPath: string;
}

/**
 * Obsidian用コンテンツ同期サービス
 */
export class ObsidianContentSyncService implements ContentSyncService {
  private contentRepository: ContentRepository;
  private repositoryRepository: RepositoryRepository;
  private obsidianAdapter: ObsidianAdapter;
  
  /**
   * コンストラクタ
   * 
   * @param contentRepository コンテンツリポジトリ
   * @param repositoryRepository リポジトリリポジトリ
   * @param obsidianAdapter Obsidianアダプター
   */
  constructor(
    contentRepository: ContentRepository,
    repositoryRepository: RepositoryRepository,
    obsidianAdapter: ObsidianAdapter
  ) {
    this.contentRepository = contentRepository;
    this.repositoryRepository = repositoryRepository;
    this.obsidianAdapter = obsidianAdapter;
  }
  
  /**
   * リポジトリのコンテンツを同期する
   * 
   * @param repositoryAggregate リポジトリ集約
   * @returns 同期結果
   */
  async syncRepository(repositoryAggregate: RepositoryAggregate): Promise<Result<SyncResult, Error>> {
    try {
      const repository = repositoryAggregate.repository;
      
      // 外部設定を取得
      const externalConfig = this.getExternalConfig(repository.id);
      
      if (!externalConfig || externalConfig.type !== "obsidian") {
        return err(new Error("リポジトリはObsidianと連携していません"));
      }
      
      // Obsidianボールトを開く
      const vaultResult = await this.obsidianAdapter.openVault(externalConfig.vaultPath);
      
      if (vaultResult.isErr()) {
        return err(vaultResult.error);
      }
      
      // 現在のコンテンツを取得
      const currentContents = await this.contentRepository.findByRepositoryId(repository.id);
      const currentContentMap = new Map<string, ContentAggregate>();
      
      for (const content of currentContents) {
        currentContentMap.set(content.content.path, content);
      }
      
      // 同期結果を初期化
      const result: SyncResult = {
        added: [],
        updated: [],
        deleted: [],
        errors: []
      };
      
      // Obsidianのノートを収集
      const obsidianNotes: ObsidianNote[] = [];
      await this.collectAllNotes(vaultResult.value.path, "", obsidianNotes);
      
      // Obsidianのノートを処理
      for (const note of obsidianNotes) {
        try {
          const currentContent = currentContentMap.get(note.path);
          
          if (currentContent) {
            // 既存のコンテンツを更新
            const content = currentContent.content;
            
            // 内容が変更されている場合のみ更新
            if (content.body !== note.content) {
              const updatedContent = createContent({
                ...content,
                title: note.name,
                body: note.content,
                updatedAt: new Date()
              });
              
              const updatedAggregate = createContentAggregate(updatedContent);
              const savedContent = await this.contentRepository.save(updatedAggregate);
              
              result.updated.push(savedContent);
              currentContentMap.delete(note.path);
            } else {
              // 変更がない場合は処理済みとしてマップから削除
              currentContentMap.delete(note.path);
            }
          } else {
            // 新規コンテンツを作成
            const metadata = createContentMetadata({
              tags: note.tags,
              categories: [],
              language: "ja"
            });
            
            const newContent = createContent({
              id: generateId(),
              userId: repository.userId,
              repositoryId: repository.id,
              path: note.path,
              title: note.name,
              body: note.content,
              metadata,
              visibility: "private",
              versions: [],
              createdAt: note.createdAt || new Date(),
              updatedAt: note.modifiedAt || new Date()
            });
            
            const newAggregate = createContentAggregate(newContent);
            const savedContent = await this.contentRepository.save(newAggregate);
            
            result.added.push(savedContent);
          }
        } catch (error) {
          result.errors.push(error instanceof Error ? error : new Error(String(error)));
        }
      }
      
      // 残ったコンテンツは削除されたものとして処理
      for (const [path, content] of currentContentMap.entries()) {
        try {
          await this.contentRepository.delete(content.content.id);
          result.deleted.push(content.content.id);
        } catch (error) {
          result.errors.push(error instanceof Error ? error : new Error(String(error)));
        }
      }
      
      return ok(result);
    } catch (error) {
      return err(error instanceof Error ? error : new Error(String(error)));
    }
  }
  
  /**
   * 特定のコンテンツを同期する
   * 
   * @param contentAggregate コンテンツ集約
   * @returns 同期されたコンテンツ集約
   */
  async syncContent(contentAggregate: ContentAggregate): Promise<Result<ContentAggregate, Error>> {
    try {
      const content = contentAggregate.content;
      
      // リポジトリを取得
      const repository = await this.repositoryRepository.findById(content.repositoryId);
      
      if (!repository) {
        return err(new Error(`リポジトリが見つかりません: ${content.repositoryId}`));
      }
      
      // 外部設定を取得
      const externalConfig = this.getExternalConfig(repository.repository.id);
      
      if (!externalConfig || externalConfig.type !== "obsidian") {
        return err(new Error("リポジトリはObsidianと連携していません"));
      }
      
      // Obsidianボールトを開く
      const vaultResult = await this.obsidianAdapter.openVault(externalConfig.vaultPath);
      
      if (vaultResult.isErr()) {
        return err(vaultResult.error);
      }
      
      // ノートを取得
      const noteResult = await this.obsidianAdapter.getNote(content.path);
      
      if (noteResult.isErr()) {
        return err(noteResult.error);
      }
      
      const note = noteResult.value;
      
      // 内容が変更されている場合のみ更新
      if (content.body !== note.content || content.title !== note.name) {
        const updatedContent = createContent({
          ...content,
          title: note.name,
          body: note.content,
          updatedAt: new Date()
        });
        
        const updatedAggregate = createContentAggregate(updatedContent);
        const savedContent = await this.contentRepository.save(updatedAggregate);
        
        return ok(savedContent);
      }
      
      // 変更がない場合は元のコンテンツを返す
      return ok(contentAggregate);
    } catch (error) {
      return err(error instanceof Error ? error : new Error(String(error)));
    }
  }
  
  /**
   * リポジトリのコンテンツを外部リポジトリにプッシュする
   * 
   * @param repositoryAggregate リポジトリ集約
   * @returns 同期結果
   */
  async pushRepository(repositoryAggregate: RepositoryAggregate): Promise<Result<SyncResult, Error>> {
    try {
      const repository = repositoryAggregate.repository;
      
      // 外部設定を取得
      const externalConfig = this.getExternalConfig(repository.id);
      
      if (!externalConfig || externalConfig.type !== "obsidian") {
        return err(new Error("リポジトリはObsidianと連携していません"));
      }
      
      // Obsidianボールトを開く
      const vaultResult = await this.obsidianAdapter.openVault(externalConfig.vaultPath);
      
      if (vaultResult.isErr()) {
        return err(vaultResult.error);
      }
      
      // 現在のコンテンツを取得
      const currentContents = await this.contentRepository.findByRepositoryId(repository.id);
      
      // 同期結果を初期化
      const result: SyncResult = {
        added: [],
        updated: [],
        deleted: [],
        errors: []
      };
      
      // 各コンテンツをObsidianにプッシュ
      for (const contentAggregate of currentContents) {
        const pushResult = await this.pushContent(contentAggregate);
        
        if (pushResult.isOk()) {
          result.updated.push(pushResult.value);
        } else {
          result.errors.push(pushResult.error);
        }
      }
      
      return ok(result);
    } catch (error) {
      return err(error instanceof Error ? error : new Error(String(error)));
    }
  }
  
  /**
   * 特定のコンテンツを外部リポジトリにプッシュする
   * 
   * @param contentAggregate コンテンツ集約
   * @returns 同期されたコンテンツ集約
   */
  async pushContent(contentAggregate: ContentAggregate): Promise<Result<ContentAggregate, Error>> {
    try {
      const content = contentAggregate.content;
      
      // リポジトリを取得
      const repository = await this.repositoryRepository.findById(content.repositoryId);
      
      if (!repository) {
        return err(new Error(`リポジトリが見つかりません: ${content.repositoryId}`));
      }
      
      // 外部設定を取得
      const externalConfig = this.getExternalConfig(repository.repository.id);
      
      if (!externalConfig || externalConfig.type !== "obsidian") {
        return err(new Error("リポジトリはObsidianと連携していません"));
      }
      
      // Obsidianボールトを開く
      const vaultResult = await this.obsidianAdapter.openVault(externalConfig.vaultPath);
      
      if (vaultResult.isErr()) {
        return err(vaultResult.error);
      }
      
      // メタデータを準備
      const frontMatter: Record<string, unknown> = {};
      
      if (content.metadata.tags.length > 0) {
        frontMatter.tags = content.metadata.tags;
      }
      
      if (content.metadata.categories.length > 0) {
        frontMatter.categories = content.metadata.categories;
      }
      
      // ノートを保存
      const saveResult = await this.obsidianAdapter.saveNote(
        content.path,
        content.body,
        frontMatter
      );
      
      if (saveResult.isErr()) {
        return err(saveResult.error);
      }
      
      // 更新日時を更新
      const updatedContent = createContent({
        ...content,
        updatedAt: new Date()
      });
      
      const updatedAggregate = createContentAggregate(updatedContent);
      const savedContent = await this.contentRepository.save(updatedAggregate);
      
      return ok(savedContent);
    } catch (error) {
      return err(error instanceof Error ? error : new Error(String(error)));
    }
  }
  
  /**
   * 再帰的にすべてのノートを収集する
   * 
   * @param vaultPath ボールトのパス
   * @param folderPath フォルダのパス
   * @param notes 収集されたノート
   */
  private async collectAllNotes(
    vaultPath: string,
    folderPath: string,
    notes: ObsidianNote[]
  ): Promise<void> {
    // フォルダを取得
    const folderResult = await this.obsidianAdapter.getFolder(folderPath);
    
    if (folderResult.isErr()) {
      return;
    }
    
    const folder = folderResult.value;
    
    // ノートを収集
    for (const notePath of folder.notes) {
      const noteResult = await this.obsidianAdapter.getNote(notePath);
      
      if (noteResult.isOk()) {
        notes.push(noteResult.value);
      }
    }
    
    // サブフォルダを再帰的に処理
    for (const subfolderPath of folder.subfolders) {
      await this.collectAllNotes(vaultPath, subfolderPath, notes);
    }
  }
  
  /**
   * 外部リポジトリ設定を取得する
   * 
   * @param repositoryId リポジトリID
   * @returns 外部リポジトリ設定
   */
  private getExternalConfig(repositoryId: string): ExternalRepositoryConfig | null {
    // 実際の実装では、リポジトリエンティティから外部設定を取得する方法を実装する必要があります
    // ここではダミーの実装を返します
    return {
      type: "obsidian",
      vaultPath: "/path/to/obsidian/vault"
    };
  }
} 