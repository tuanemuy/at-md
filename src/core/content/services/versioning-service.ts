import { Content, createContent, ContentId, DomainValidationError } from "../entities/content.ts";
import { Version, createVersion, ContentChanges, VersionId, CommitId, createVersionId, createCommitId } from "../value-objects/version.ts";
import { ContentMetadata, createContentMetadata } from "../value-objects/content-metadata.ts";
import { generateId } from "../../common/id.ts";
import { InvalidContentStateError } from "../../errors/domain.ts";
import { Result, ok, err } from "../deps.ts";

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
    commitIdStr: string,
    changes: ContentChanges
  ): Result<Content, DomainValidationError> {
    // コミットIDを型安全な値に変換
    const commitIdResult = createCommitId(commitIdStr);
    if (commitIdResult.isErr()) {
      return err(commitIdResult.error);
    }
    const commitId = commitIdResult.value;

    // バージョンIDを生成
    const versionIdResult = createVersionId(generateId());
    if (versionIdResult.isErr()) {
      return err(versionIdResult.error);
    }
    const versionId = versionIdResult.value;

    try {
      // 新しいバージョンを作成
      const version = createVersion({
        id: versionId.toString(),
        contentId: content.id,
        commitId: commitId.toString(),
        createdAt: new Date(),
        changes
      });

      // コンテンツにバージョンを追加
      const updatedContent = content.addVersion(version);

      // 変更内容をコンテンツに適用
      const contentParams = {
        ...updatedContent,
        updatedAt: new Date()
      };

      // タイトルの変更があれば適用
      if (changes.title) {
        contentParams.title = changes.title;
      }

      // 本文の変更があれば適用
      if (changes.body) {
        contentParams.body = changes.body;
      }

      // メタデータの変更があれば適用
      if (changes.metadata) {
        contentParams.metadata = {
          ...updatedContent.metadata,
          ...changes.metadata
        };
      }

      return createContent(contentParams);
    } catch (error) {
      if (error instanceof DomainValidationError) {
        return err(error);
      }
      return err(new DomainValidationError("バージョン付きコンテンツの作成に失敗しました", error));
    }
  }

  /**
   * コンテンツの履歴を取得する
   * @param content コンテンツ
   * @returns バージョン履歴
   */
  getContentHistory(content: Content): Version[] {
    // バージョンを作成日時の降順でソート
    return [...content.versions].sort((a, b) => 
      b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  /**
   * 特定のコミットIDに対応するバージョンを検索する
   * @param content コンテンツ
   * @param commitId コミットID
   * @returns 見つかったバージョン、または undefined
   */
  findVersionByCommitId(content: Content, commitId: string): Version | undefined {
    return content.versions.find(version => version.commitId.toString() === commitId);
  }

  /**
   * 特定のバージョンの状態にコンテンツを復元する
   * @param content 現在のコンテンツ
   * @param commitId 復元先のコミットID
   * @returns 復元されたコンテンツ
   */
  restoreVersion(content: Content, commitId: string): Result<Content, DomainValidationError> {
    // 指定されたコミットIDのバージョンを検索
    const targetVersion = this.findVersionByCommitId(content, commitId);
    if (!targetVersion) {
      return err(new DomainValidationError(`コミットID ${commitId} のバージョンが見つかりません`));
    }

    // バージョン履歴を作成日時の昇順でソート
    const sortedVersions = [...content.versions].sort((a, b) => 
      a.createdAt.getTime() - b.createdAt.getTime()
    );

    // 元のタイトルと本文を推測
    const originalTitle = this.inferOriginalValue(content, sortedVersions, "title");
    const originalBody = this.inferOriginalValue(content, sortedVersions, "body");
    const originalMetadata = this.inferOriginalMetadata(content, sortedVersions);

    // 復元対象のバージョンまでの変更を適用
    let restoredTitle = originalTitle;
    let restoredBody = originalBody;
    let restoredMetadata = originalMetadata;

    // バージョン履歴を順に適用
    for (const version of sortedVersions) {
      // 対象のバージョンまで適用
      if (version.createdAt.getTime() <= targetVersion.createdAt.getTime()) {
        if (version.changes.title) {
          restoredTitle = version.changes.title;
        }
        if (version.changes.body) {
          restoredBody = version.changes.body;
        }
        if (version.changes.metadata) {
          restoredMetadata = {
            ...restoredMetadata,
            ...version.changes.metadata
          };
        }
      } else {
        // 対象より新しいバージョンは無視
        break;
      }
    }

    // 復元されたコンテンツを作成
    return createContent({
      ...content,
      title: restoredTitle,
      body: restoredBody,
      metadata: restoredMetadata,
      updatedAt: new Date()
    });
  }

  /**
   * バージョン履歴から元のプロパティ値を推測する
   * @param content 現在のコンテンツ
   * @param sortedVersions ソート済みのバージョン履歴
   * @param property プロパティ名
   * @returns 推測された元の値
   */
  protected inferOriginalValue(content: Content, sortedVersions: Version[], property: "title" | "body"): string {
    // 現在の値を取得
    const currentValue = content[property];
    
    // バージョン履歴が空の場合は現在の値を返す
    if (sortedVersions.length === 0) {
      return currentValue;
    }
    
    // 最後のバージョンから逆算
    let value = currentValue;
    
    // バージョン履歴を逆順に処理
    for (let i = sortedVersions.length - 1; i >= 0; i--) {
      const version = sortedVersions[i];
      if (version.changes[property]) {
        // このバージョンで変更があった場合、元の値は不明
        // 最も古いバージョンの値を返す
        return i === 0 ? value : "";
      }
    }
    
    // 変更がなかった場合は現在の値を返す
    return value;
  }

  /**
   * バージョン履歴から元のメタデータを推測する
   * @param content 現在のコンテンツ
   * @param sortedVersions ソート済みのバージョン履歴
   * @returns 推測された元のメタデータ
   */
  protected inferOriginalMetadata(content: Content, sortedVersions: Version[]): ContentMetadata {
    // 現在のメタデータを取得
    const currentMetadata = content.metadata;
    
    // バージョン履歴が空の場合は現在のメタデータを返す
    if (sortedVersions.length === 0) {
      return currentMetadata;
    }
    
    // 最後のバージョンから逆算
    let metadata = { ...currentMetadata };
    
    // バージョン履歴を逆順に処理
    for (let i = sortedVersions.length - 1; i >= 0; i--) {
      const version = sortedVersions[i];
      if (version.changes.metadata) {
        // このバージョンでメタデータの変更があった場合、元の値は不明
        // 最も古いバージョンの値を返す
        return i === 0 ? metadata : createContentMetadata({
          language: "ja", // デフォルト値
          tags: [],
          categories: []
        });
      }
    }
    
    // 変更がなかった場合は現在のメタデータを返す
    return metadata;
  }
} 