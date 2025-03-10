/**
 * バージョニングサービス
 * 
 * コンテンツのバージョン管理を担当するサービス
 */

import { Result, ok, err } from "../deps.ts";
import { generateId } from "../../common/mod.ts";
import { DomainError } from "../../errors/mod.ts";
import { Content, ContentParams, createContent } from "../entities/content.ts";
import { Version, createVersion, VersionParams, ContentChanges } from "../value-objects/version.ts";
import { ContentMetadata, createContentMetadata } from "../value-objects/content-metadata.ts";
import { InvalidContentStateError } from "../../errors/mod.ts";
import { titleSchema, bodySchema, languageSchema, tagSchema, categorySchema, readingTimeSchema } from "../../common/schemas/mod.ts";

/**
 * バージョン管理サービス
 * コンテンツのバージョン管理に関する機能を提供する
 */
export class VersioningService {
  /**
   * 2つのコンテンツの差分を計算する
   * @param oldContent 古いコンテンツ
   * @param newContent 新しいコンテンツ
   * @returns 変更内容
   */
  calculateDiff(oldContent: Content, newContent: Content): ContentChanges {
    const changes: ContentChanges = {};

    // タイトルの変更を検出
    if (oldContent.title !== newContent.title) {
      const titleResult = titleSchema.safeParse(newContent.title);
      if (titleResult.success) {
        changes.title = titleResult.data;
      }
    }

    // 本文の変更を検出
    if (oldContent.body !== newContent.body) {
      const bodyResult = bodySchema.safeParse(newContent.body);
      if (bodyResult.success) {
        changes.body = bodyResult.data;
      }
    }

    // メタデータの変更を検出
    if (JSON.stringify(oldContent.metadata) !== JSON.stringify(newContent.metadata)) {
      // 各プロパティを個別に処理してブランド型を維持
      const metadata: ContentChanges['metadata'] = {};
      
      // 言語の処理
      if (newContent.metadata.language) {
        const languageResult = languageSchema.safeParse(newContent.metadata.language);
        if (languageResult.success) {
          metadata.language = languageResult.data;
        }
      }
      
      // タグの処理
      if (newContent.metadata.tags && newContent.metadata.tags.length > 0) {
        // タグは個別に処理してブランド型を維持
        const brandedTags = newContent.metadata.tags.map(tag => {
          const tagResult = tagSchema.safeParse(tag);
          return tagResult.success ? tagResult.data : tag;
        }).filter((tag): tag is typeof tagSchema._type => 
          tagSchema.safeParse(tag).success
        );
        
        if (brandedTags.length > 0) {
          metadata.tags = brandedTags;
        }
      }
      
      // カテゴリの処理
      if (newContent.metadata.categories && newContent.metadata.categories.length > 0) {
        // カテゴリは個別に処理してブランド型を維持
        const brandedCategories = newContent.metadata.categories.map(category => {
          const categoryResult = categorySchema.safeParse(category);
          return categoryResult.success ? categoryResult.data : category;
        }).filter((category): category is typeof categorySchema._type => 
          categorySchema.safeParse(category).success
        );
        
        if (brandedCategories.length > 0) {
          metadata.categories = brandedCategories;
        }
      }
      
      // 読了時間の処理
      if (newContent.metadata.readingTime) {
        const readingTimeResult = readingTimeSchema.safeParse(newContent.metadata.readingTime);
        if (readingTimeResult.success) {
          metadata.readingTime = readingTimeResult.data;
        }
      }
      
      // メタデータに変更がある場合のみ設定
      if (Object.keys(metadata).length > 0) {
        changes.metadata = metadata;
      }
    }

    return changes;
  }

  /**
   * バージョン履歴を持つコンテンツを作成する
   * @param content 元のコンテンツ
   * @param commitId コミットID
   * @param changes 変更内容
   * @returns 新しいバージョンを追加したコンテンツ
   */
  createVersionedContent(
    content: Content,
    commitId: string,
    changes: ContentChanges
  ): Result<Content, DomainError> {
    // 変更がない場合は元のコンテンツをそのまま返す
    if (Object.keys(changes).length === 0) {
      return ok(content);
    }

    // 新しいバージョンを作成
    const versionResult = createVersion({
      id: generateId(),
      contentId: content.id,
      commitId,
      createdAt: new Date(),
      changes
    });

    if (versionResult.isErr()) {
      return err(versionResult.error);
    }

    // コンテンツにバージョンを追加
    const updatedContentResult = content.addVersion(versionResult.value);

    if (updatedContentResult.isErr()) {
      return err(updatedContentResult.error);
    }

    const updatedContent = updatedContentResult.value;

    // 変更を適用したコンテンツを作成
    let newContent: ContentParams = { ...updatedContent };
    
    if (changes.title) {
      newContent = { ...newContent, title: changes.title };
    }
    
    if (changes.body) {
      newContent = { ...newContent, body: changes.body };
    }
    
    if (changes.metadata) {
      // メタデータが部分的な場合は、既存のメタデータとマージする
      const mergedMetadataResult = createContentMetadata({
        language: changes.metadata.language || updatedContent.metadata.language,
        tags: changes.metadata.tags || updatedContent.metadata.tags,
        categories: changes.metadata.categories || updatedContent.metadata.categories,
        publishedAt: updatedContent.metadata.publishedAt,
        lastPublishedAt: updatedContent.metadata.lastPublishedAt,
        excerpt: updatedContent.metadata.excerpt,
        featuredImage: updatedContent.metadata.featuredImage,
        readingTime: changes.metadata.readingTime || updatedContent.metadata.readingTime
      });
      
      if (mergedMetadataResult.isErr()) {
        return err(mergedMetadataResult.error);
      }
      
      newContent = { ...newContent, metadata: mergedMetadataResult.value };
    }
    
    return createContent({
      ...newContent,
      updatedAt: new Date()
    });
  }

  /**
   * コンテンツの変更履歴を取得する
   * @param content コンテンツ
   * @returns バージョン履歴
   */
  getContentHistory(content: Content): Version[] {
    return [...content.versions].sort((a, b) => 
      b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  /**
   * コミットIDからバージョンを検索する
   * @param content コンテンツ
   * @param commitId 検索するコミットID
   * @returns 見つかったバージョン、見つからない場合はundefined
   */
  findVersionByCommitId(content: Content, commitId: string): Version | undefined {
    return content.versions.find(version => version.commitId === commitId);
  }

  /**
   * 特定のバージョンのコンテンツを復元する
   * @param content 現在のコンテンツ
   * @param commitId 復元するバージョンのコミットID
   * @returns 復元されたコンテンツ
   * @throws {InvalidContentStateError} 指定されたコミットIDのバージョンが見つからない場合
   */
  restoreVersion(content: Content, commitId: string): Result<Content, DomainError> {
    // 指定されたコミットIDのバージョンを検索
    const targetVersion = this.findVersionByCommitId(content, commitId);
    if (!targetVersion) {
      return err(new InvalidContentStateError(
        "バージョンが見つかりません",
        `コミットID ${commitId} のバージョンを復元`
      ));
    }

    // バージョン履歴を時系列順にソート（古い順）
    const sortedVersions = [...content.versions].sort((a, b) => 
      a.createdAt.getTime() - b.createdAt.getTime()
    );
    
    // 対象バージョンのインデックスを取得
    const targetIndex = sortedVersions.findIndex(v => v.commitId === commitId);
    if (targetIndex === -1) {
      return err(new InvalidContentStateError(
        "バージョンが見つかりません",
        `コミットID ${commitId} のバージョンを復元`
      ));
    }

    // 最初のバージョンの変更を適用する前の状態を推測
    // 最初のバージョンの変更内容から逆算
    const firstVersion = sortedVersions[0];
    
    // 初期状態を作成
    const initialState = {
      id: content.id,
      userId: content.userId,
      repositoryId: content.repositoryId,
      path: content.path,
      // 最初のバージョンでタイトルが変更されていれば、その前の状態を推測
      title: firstVersion.changes.title ? this.inferOriginalValue(content, sortedVersions, "title") : content.title,
      // 最初のバージョンで本文が変更されていれば、その前の状態を推測
      body: firstVersion.changes.body ? this.inferOriginalValue(content, sortedVersions, "body") : content.body,
      // 最初のバージョンでメタデータが変更されていれば、その前の状態を推測
      metadata: firstVersion.changes.metadata ? this.inferOriginalMetadata(content, sortedVersions) : content.metadata,
      visibility: content.visibility,
      createdAt: content.createdAt,
      updatedAt: new Date(),
      versions: content.versions // バージョン履歴は保持
    };

    // 対象バージョンまでの変更を適用
    let restoredContent = { ...initialState };
    
    // 対象バージョンまでの変更を順番に適用
    for (let i = 0; i <= targetIndex; i++) {
      const version = sortedVersions[i];
      
      if (version.changes.title) {
        restoredContent = {
          ...restoredContent,
          title: version.changes.title
        };
      }
      
      if (version.changes.body) {
        restoredContent = {
          ...restoredContent,
          body: version.changes.body
        };
      }
      
      if (version.changes.metadata) {
        // メタデータが部分的な場合は、既存のメタデータとマージする
        const currentMetadata = restoredContent.metadata;
        const mergedMetadataResult = createContentMetadata({
          language: version.changes.metadata.language || currentMetadata.language,
          tags: version.changes.metadata.tags || currentMetadata.tags,
          categories: version.changes.metadata.categories || currentMetadata.categories,
          publishedAt: currentMetadata.publishedAt,
          lastPublishedAt: currentMetadata.lastPublishedAt,
          excerpt: currentMetadata.excerpt,
          featuredImage: currentMetadata.featuredImage,
          readingTime: version.changes.metadata.readingTime || currentMetadata.readingTime
        });
        
        if (mergedMetadataResult.isErr()) {
          return err(mergedMetadataResult.error);
        }
        
        restoredContent = {
          ...restoredContent,
          metadata: mergedMetadataResult.value
        };
      }
    }

    // 最終的なコンテンツを作成
    return createContent(restoredContent);
  }

  /**
   * コンテンツの元の値を推測する
   * @param content 現在のコンテンツ
   * @param sortedVersions ソート済みのバージョン配列
   * @param property 推測するプロパティ
   * @returns 推測された元の値
   * @protected テスト用にprotectedに変更
   */
  protected inferOriginalValue(content: Content, sortedVersions: Version[], property: "title" | "body"): string {
    // 最初のバージョンから現在までの変更を追跡
    const currentValue = content[property];
    
    // バージョン履歴を逆順に辿り、変更を元に戻す
    for (let i = sortedVersions.length - 1; i >= 0; i--) {
      const version = sortedVersions[i];
      if (version.changes[property]) {
        // このバージョンで変更があった場合、現在の値はこのバージョンの変更結果
        // 元の値を推測するには、このバージョンの前の値を知る必要がある
        // しかし、それは記録されていないため、デフォルト値を返す
        return property === "title" ? "Untitled" : "";
      }
    }
    
    // 変更がなかった場合は現在の値を返す
    return currentValue;
  }

  /**
   * 元のメタデータを推測する
   * @param content 現在のコンテンツ
   * @param sortedVersions ソートされたバージョン履歴
   * @returns 推測された元のメタデータ
   * @protected テスト用にprotectedに変更
   */
  protected inferOriginalMetadata(content: Content, sortedVersions: Version[]): ContentMetadata {
    // デフォルトのメタデータを作成
    const metadataResult = createContentMetadata({
      language: "ja", // デフォルト言語
      tags: [],
      categories: []
    });
    
    if (metadataResult.isErr()) {
      // エラーの場合は空のメタデータを返す
      // 言語のブランド型を作成
      const languageResult = languageSchema.safeParse("ja");
      const language = languageResult.success ? languageResult.data : "ja";
      
      return {
        language,
        tags: [],
        categories: [],
        publishedAt: undefined,
        lastPublishedAt: undefined,
        excerpt: undefined,
        featuredImage: undefined,
        readingTime: undefined
      };
    }
    
    return metadataResult.value;
  }
} 