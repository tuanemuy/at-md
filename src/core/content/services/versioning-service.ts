import { Content, createContent } from "../entities/content.ts";
import { Version, createVersion, ContentChanges } from "../value-objects/version.ts";
import { ContentMetadata, createContentMetadata } from "../value-objects/content-metadata.ts";
import { generateId } from "../../common/id.ts";
import { InvalidContentStateError } from "../../errors/domain.ts";

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
      changes.title = newContent.title;
    }

    // 本文の変更を検出
    if (oldContent.body !== newContent.body) {
      changes.body = newContent.body;
    }

    // メタデータの変更を検出
    if (JSON.stringify(oldContent.metadata) !== JSON.stringify(newContent.metadata)) {
      changes.metadata = newContent.metadata;
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
  ): Content {
    // 変更がない場合は元のコンテンツをそのまま返す
    if (Object.keys(changes).length === 0) {
      return content;
    }

    // 新しいバージョンを作成
    const version = createVersion({
      id: generateId(),
      contentId: content.id,
      commitId,
      createdAt: new Date(),
      changes
    });

    // コンテンツにバージョンを追加
    const updatedContent = content.addVersion(version);

    // 変更を適用したコンテンツを作成
    let newContent = { ...updatedContent };
    
    if (changes.title) {
      newContent = { ...newContent, title: changes.title };
    }
    
    if (changes.body) {
      newContent = { ...newContent, body: changes.body };
    }
    
    if (changes.metadata) {
      // メタデータが部分的な場合は、既存のメタデータとマージする
      const mergedMetadata = createContentMetadata({
        language: changes.metadata.language || updatedContent.metadata.language,
        tags: changes.metadata.tags || updatedContent.metadata.tags,
        categories: changes.metadata.categories || updatedContent.metadata.categories,
        publishedAt: changes.metadata.publishedAt || updatedContent.metadata.publishedAt,
        lastPublishedAt: changes.metadata.lastPublishedAt || updatedContent.metadata.lastPublishedAt,
        excerpt: changes.metadata.excerpt || updatedContent.metadata.excerpt,
        featuredImage: changes.metadata.featuredImage || updatedContent.metadata.featuredImage,
        readingTime: changes.metadata.readingTime || updatedContent.metadata.readingTime
      });
      
      newContent = { ...newContent, metadata: mergedMetadata };
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
  restoreVersion(content: Content, commitId: string): Content {
    // 指定されたコミットIDのバージョンを検索
    const targetVersion = this.findVersionByCommitId(content, commitId);
    if (!targetVersion) {
      throw new InvalidContentStateError(
        "バージョンが見つかりません",
        `コミットID ${commitId} のバージョンを復元`
      );
    }

    // バージョン履歴を時系列順にソート（古い順）
    const sortedVersions = [...content.versions].sort((a, b) => 
      a.createdAt.getTime() - b.createdAt.getTime()
    );
    
    // 対象バージョンのインデックスを取得
    const targetIndex = sortedVersions.findIndex(v => v.commitId === commitId);
    if (targetIndex === -1) {
      throw new InvalidContentStateError(
        "バージョンが見つかりません",
        `コミットID ${commitId} のバージョンを復元`
      );
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
        const mergedMetadata = createContentMetadata({
          language: version.changes.metadata.language || currentMetadata.language,
          tags: version.changes.metadata.tags || currentMetadata.tags,
          categories: version.changes.metadata.categories || currentMetadata.categories,
          publishedAt: version.changes.metadata.publishedAt || currentMetadata.publishedAt,
          lastPublishedAt: version.changes.metadata.lastPublishedAt || currentMetadata.lastPublishedAt,
          excerpt: version.changes.metadata.excerpt || currentMetadata.excerpt,
          featuredImage: version.changes.metadata.featuredImage || currentMetadata.featuredImage,
          readingTime: version.changes.metadata.readingTime || currentMetadata.readingTime
        });
        
        restoredContent = {
          ...restoredContent,
          metadata: mergedMetadata
        };
      }
    }

    // 最終的なコンテンツを作成
    return createContent(restoredContent);
  }

  /**
   * 元の値を推測する
   * @param content 現在のコンテンツ
   * @param sortedVersions ソートされたバージョン履歴
   * @param property プロパティ名
   * @returns 推測された元の値
   * @protected テスト用にprotectedに変更
   */
  protected inferOriginalValue(content: Content, sortedVersions: Version[], property: "title" | "body"): string {
    // 最初のバージョンから現在までの変更を追跡
    let currentValue = content[property];
    
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
    return createContentMetadata({
      language: "ja", // デフォルト言語
      tags: [],
      categories: []
    });
  }
} 