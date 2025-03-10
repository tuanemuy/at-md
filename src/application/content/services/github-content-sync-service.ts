/**
 * GitHub用コンテンツ同期サービス
 * GitHubリポジトリとのコンテンツ同期を担当するサービス
 */

import { Result, ok, err } from "npm:neverthrow";
import { ContentAggregate } from "../../../core/content/aggregates/content-aggregate.ts";
import { RepositoryAggregate } from "../../../core/content/aggregates/repository-aggregate.ts";
import { ContentSyncService, SyncResult } from "./content-sync-service.ts";
import { ContentRepository } from "../repositories/content-repository.ts";
import { RepositoryRepository } from "../repositories/repository-repository.ts";
import { GitHubApiAdapter, GitHubContent, GitHubApiError } from "../../../infrastructure/adapters/github/github-api-adapter.ts";
import { createContent, generateContentId } from "../../../core/content/entities/content.ts";
import { createContentAggregate } from "../../../core/content/aggregates/content-aggregate.ts";
import { createContentMetadata } from "../../../core/content/value-objects/content-metadata.ts";
import { generateId } from "../../../core/common/id.ts";

/**
 * 外部リポジトリ設定
 */
interface ExternalRepositoryConfig {
  type: "github" | "obsidian";
  owner: string;
  repo: string;
  branch?: string;
}

/**
 * GitHub用コンテンツ同期サービス
 */
export class GitHubContentSyncService implements ContentSyncService {
  private contentRepository: ContentRepository;
  private repositoryRepository: RepositoryRepository;
  private githubApiAdapter: GitHubApiAdapter;
  
  /**
   * コンストラクタ
   * 
   * @param contentRepository コンテンツリポジトリ
   * @param repositoryRepository リポジトリリポジトリ
   * @param githubApiAdapter GitHubアダプター
   */
  constructor(
    contentRepository: ContentRepository,
    repositoryRepository: RepositoryRepository,
    githubApiAdapter: GitHubApiAdapter
  ) {
    this.contentRepository = contentRepository;
    this.repositoryRepository = repositoryRepository;
    this.githubApiAdapter = githubApiAdapter;
  }
  
  /**
   * リポジトリのコンテンツを同期する
   * GitHubリポジトリからコンテンツを取得し、ローカルリポジトリと同期します。
   * 
   * @param repositoryAggregate リポジトリ集約
   * @returns 同期結果
   */
  async syncRepository(repositoryAggregate: RepositoryAggregate): Promise<Result<SyncResult, Error>> {
    try {
      const repository = repositoryAggregate.repository;
      
      // 外部設定を取得
      const externalConfig = this.getExternalConfig(repository.id);
      
      if (!externalConfig || externalConfig.type !== "github") {
        return err(new Error("リポジトリはGitHubと連携していません"));
      }
      
      // GitHubからファイル一覧を取得
      const contentsResult = await this.githubApiAdapter.getContents(
        externalConfig.owner,
        externalConfig.repo,
        "",  // ルートディレクトリ
        externalConfig.branch || "main"
      );
      
      if (contentsResult.isErr()) {
        return err(contentsResult.error);
      }
      
      // すべてのファイルを再帰的に取得
      const githubFiles: GitHubContent[] = [];
      await this.collectAllFiles(
        externalConfig.owner,
        externalConfig.repo,
        contentsResult.value,
        externalConfig.branch || "main",
        githubFiles
      );
      
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
      
      // GitHubのファイルを処理
      for (const file of githubFiles) {
        // マークダウンファイルのみ処理
        if (!file.path.endsWith(".md")) {
          continue;
        }
        
        try {
          // ファイルの内容を取得
          const contentResult = await this.githubApiAdapter.getContent(
            externalConfig.owner,
            externalConfig.repo,
            file.path,
            externalConfig.branch || "main"
          );
          
          if (contentResult.isErr()) {
            result.errors.push(contentResult.error);
            continue;
          }
          
          const fileContent = contentResult.value.content || "";
          const currentContent = currentContentMap.get(file.path);
          
          // Base64デコード（GitHubAPIはBase64でコンテンツを返す）
          const decodedContent = atob(fileContent);
          
          // タイトルを抽出（最初の# 行または、ファイル名）
          const titleMatch = decodedContent.match(/^#\s+(.+)$/m);
          const title = titleMatch ? titleMatch[1] : file.name.replace(/\.md$/, "");
          
          if (currentContent) {
            // 既存のコンテンツを更新
            await this.updateExistingContent(currentContent, title, decodedContent, result);
            currentContentMap.delete(file.path);
          } else {
            // 新規コンテンツを作成
            await this.createNewContent(repositoryAggregate, file.path, title, decodedContent, result);
          }
        } catch (error) {
          result.errors.push(error instanceof Error ? error : new Error(String(error)));
        }
      }
      
      // 残ったコンテンツは削除されたものとして処理
      await this.handleDeletedContents(currentContentMap, result);
      
      return ok(result);
    } catch (error) {
      return err(error instanceof Error ? error : new Error(String(error)));
    }
  }
  
  /**
   * 特定のコンテンツを同期する
   * GitHubリポジトリから特定のコンテンツを取得し、ローカルリポジトリと同期します。
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
      
      if (!externalConfig || externalConfig.type !== "github") {
        return err(new Error("リポジトリはGitHubと連携していません"));
      }
      
      // GitHubからファイルの内容を取得
      const contentResult = await this.githubApiAdapter.getContent(
        externalConfig.owner,
        externalConfig.repo,
        content.path,
        externalConfig.branch || "main"
      );
      
      if (contentResult.isErr()) {
        return err(contentResult.error);
      }
      
      const fileContent = contentResult.value.content || "";
      
      // Base64デコード（GitHubAPIはBase64でコンテンツを返す）
      const decodedContent = atob(fileContent);
      
      // タイトルを抽出（最初の# 行または、現在のタイトル）
      const titleMatch = decodedContent.match(/^#\s+(.+)$/m);
      const title = titleMatch ? titleMatch[1] : content.title;
      
      // 内容が変更されている場合のみ更新
      if (content.body !== decodedContent || content.title !== title) {
        const updatedContent = createContent({
          ...content,
          title,
          body: decodedContent,
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
   * ローカルリポジトリのコンテンツをGitHubリポジトリにプッシュします。
   * 
   * @param repositoryAggregate リポジトリ集約
   * @returns 同期結果
   */
  async pushRepository(repositoryAggregate: RepositoryAggregate): Promise<Result<SyncResult, Error>> {
    try {
      const repository = repositoryAggregate.repository;
      
      // 外部設定を取得
      const externalConfig = this.getExternalConfig(repository.id);
      
      if (!externalConfig || externalConfig.type !== "github") {
        return err(new Error("リポジトリはGitHubと連携していません"));
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
      
      // 各コンテンツをGitHubにプッシュ
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
   * 特定のコンテンツをGitHubリポジトリにプッシュします。
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
      
      if (!externalConfig || externalConfig.type !== "github") {
        return err(new Error("リポジトリはGitHubと連携していません"));
      }
      
      // GitHubにファイルをプッシュ
      // 既存のファイルを取得して、SHAを取得
      const existingFileResult = await this.githubApiAdapter.getContent(
        externalConfig.owner,
        externalConfig.repo,
        content.path,
        externalConfig.branch || "main"
      ).catch(() => null); // ファイルが存在しない場合はnullを返す
      
      const message = `Update ${content.path}`;
      let updateResult;
      
      if (existingFileResult && existingFileResult.isOk()) {
        // 既存のファイルを更新
        // 実際の実装では、GitHubApiAdapterにupdateContentメソッドを追加する必要があります
        updateResult = await this.updateGitHubContent(
          externalConfig.owner,
          externalConfig.repo,
          content.path,
          content.body,
          message,
          existingFileResult.value.sha,
          externalConfig.branch || "main"
        );
      } else {
        // 新規ファイルを作成
        // 実際の実装では、GitHubApiAdapterにcreateContentメソッドを追加する必要があります
        updateResult = await this.createGitHubContent(
          externalConfig.owner,
          externalConfig.repo,
          content.path,
          content.body,
          message,
          externalConfig.branch || "main"
        );
      }
      
      if (updateResult.isErr()) {
        return err(updateResult.error);
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
   * 既存のコンテンツを更新する
   * 
   * @param currentContent 現在のコンテンツ
   * @param title 新しいタイトル
   * @param content 新しい内容
   * @param result 同期結果
   */
  private async updateExistingContent(
    currentContent: ContentAggregate,
    title: string,
    content: string,
    result: SyncResult
  ): Promise<void> {
    const existingContent = currentContent.content;
    
    // 内容が変更されている場合のみ更新
    if (existingContent.body !== content) {
      const updatedContent = createContent({
        ...existingContent,
        title,
        body: content,
        updatedAt: new Date()
      });
      
      const updatedAggregate = createContentAggregate(updatedContent);
      const savedContent = await this.contentRepository.save(updatedAggregate);
      
      result.updated.push(savedContent);
    }
  }
  
  /**
   * 新しいコンテンツを作成する
   * @param repository リポジトリ集約
   * @param path パス
   * @param title タイトル
   * @param content コンテンツ
   * @param result 同期結果
   */
  private async createNewContent(
    repository: RepositoryAggregate,
    path: string,
    title: string,
    content: string,
    result: SyncResult
  ): Promise<void> {
    const metadata = createContentMetadata({
      tags: [],
      categories: [],
      language: "ja"
    });
    
    // コンテンツIDの生成
    const contentIdResult = generateContentId();
    if (contentIdResult.isErr()) {
      throw new Error(`コンテンツIDの生成に失敗しました: ${contentIdResult.error.message}`);
    }
    const contentId = contentIdResult._unsafeUnwrap();
    
    const newContent = createContent({
      id: contentId,
      userId: repository.repository.userId,
      repositoryId: repository.repository.id,
      path,
      title,
      body: content,
      metadata,
      visibility: "private",
      versions: [],
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    const newAggregate = createContentAggregate(newContent);
    const savedContent = await this.contentRepository.save(newAggregate);
    
    result.added.push(savedContent);
  }
  
  /**
   * 削除されたコンテンツを処理する
   * 
   * @param contentMap コンテンツマップ
   * @param result 同期結果
   */
  private async handleDeletedContents(
    contentMap: Map<string, ContentAggregate>,
    result: SyncResult
  ): Promise<void> {
    for (const [path, content] of contentMap.entries()) {
      try {
        await this.contentRepository.delete(content.content.id);
        result.deleted.push(content.content.id);
      } catch (error) {
        result.errors.push(error instanceof Error ? error : new Error(String(error)));
      }
    }
  }
  
  /**
   * 再帰的にすべてのファイルを収集する
   * 
   * @param owner リポジトリのオーナー
   * @param repo リポジトリ名
   * @param contents コンテンツ一覧
   * @param branch ブランチ名
   * @param files 収集されたファイル
   */
  private async collectAllFiles(
    owner: string,
    repo: string,
    contents: GitHubContent[],
    branch: string,
    files: GitHubContent[]
  ): Promise<void> {
    for (const content of contents) {
      if (content.type === "file") {
        files.push(content);
      } else if (content.type === "dir") {
        const dirContentsResult = await this.githubApiAdapter.getContents(
          owner,
          repo,
          content.path,
          branch
        );
        
        if (dirContentsResult.isOk()) {
          await this.collectAllFiles(owner, repo, dirContentsResult.value, branch, files);
        }
      }
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
      type: "github",
      owner: "example-owner",
      repo: "example-repo",
      branch: "main"
    };
  }
  
  /**
   * GitHubコンテンツを更新する
   * 
   * @param owner リポジトリのオーナー
   * @param repo リポジトリ名
   * @param path ファイルパス
   * @param content ファイルの内容
   * @param message コミットメッセージ
   * @param sha ファイルのSHA
   * @param branch ブランチ名
   * @returns 更新結果
   */
  private async updateGitHubContent(
    owner: string,
    repo: string,
    path: string,
    content: string,
    message: string,
    sha: string,
    branch: string
  ) {
    // 実際の実装では、GitHubApiAdapterのメソッドを呼び出します
    // ここではダミーの実装を返します
    return ok({ sha: "updated-sha" });
  }
  
  /**
   * GitHubコンテンツを作成する
   * 
   * @param owner リポジトリのオーナー
   * @param repo リポジトリ名
   * @param path ファイルパス
   * @param content ファイルの内容
   * @param message コミットメッセージ
   * @param branch ブランチ名
   * @returns 作成結果
   */
  private async createGitHubContent(
    owner: string,
    repo: string,
    path: string,
    content: string,
    message: string,
    branch: string
  ) {
    // 実際の実装では、GitHubApiAdapterのメソッドを呼び出します
    // ここではダミーの実装を返します
    return ok({ sha: "created-sha" });
  }
} 