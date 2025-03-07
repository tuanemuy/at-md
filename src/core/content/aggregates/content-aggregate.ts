import { Content, createContent } from "../entities/content.ts";
import { ContentMetadata } from "../value-objects/content-metadata.ts";
import { Version, createVersion } from "../value-objects/version.ts";
import { generateId } from "../../common/id.ts";

/**
 * コンテンツ集約を表すインターフェース
 * コンテンツエンティティとそれに関連する操作をカプセル化する
 */
export interface ContentAggregate {
  /** コンテンツエンティティ */
  readonly content: Content;

  /**
   * タイトルを更新する
   * @param title 新しいタイトル
   * @returns 新しいContentAggregateインスタンス
   */
  updateTitle(title: string): ContentAggregate;

  /**
   * 本文を更新する
   * @param body 新しい本文
   * @returns 新しいContentAggregateインスタンス
   */
  updateBody(body: string): ContentAggregate;

  /**
   * メタデータを更新する
   * @param metadata 新しいメタデータ
   * @returns 新しいContentAggregateインスタンス
   */
  updateMetadata(metadata: ContentMetadata): ContentAggregate;

  /**
   * コンテンツを公開する（public）
   * @returns 新しいContentAggregateインスタンス
   */
  publish(): ContentAggregate;

  /**
   * コンテンツを非公開にする（private）
   * @returns 新しいContentAggregateインスタンス
   */
  makePrivate(): ContentAggregate;

  /**
   * コンテンツを限定公開にする（unlisted）
   * @returns 新しいContentAggregateインスタンス
   */
  makeUnlisted(): ContentAggregate;
}

/**
 * ContentAggregateを作成する
 * @param content コンテンツエンティティ
 * @returns 不変なContentAggregateオブジェクト
 */
export function createContentAggregate(content: Content): ContentAggregate {
  const aggregate: ContentAggregate = {
    content,

    updateTitle(title: string): ContentAggregate {
      // バージョンを作成
      const version = createVersion({
        id: generateId(),
        contentId: this.content.id,
        commitId: generateId(), // 実際の実装ではGitHubのコミットIDを使用
        createdAt: new Date(),
        changes: {
          title
        }
      });

      // コンテンツを更新
      const updatedContent = this.content.addVersion(version);
      
      // タイトルを更新したコンテンツを作成
      const contentWithNewTitle = createContent({
        ...updatedContent,
        title,
        updatedAt: new Date()
      });

      return createContentAggregate(contentWithNewTitle);
    },

    updateBody(body: string): ContentAggregate {
      // バージョンを作成
      const version = createVersion({
        id: generateId(),
        contentId: this.content.id,
        commitId: generateId(), // 実際の実装ではGitHubのコミットIDを使用
        createdAt: new Date(),
        changes: {
          body
        }
      });

      // コンテンツを更新
      const updatedContent = this.content.addVersion(version);
      
      // 本文を更新したコンテンツを作成
      const contentWithNewBody = createContent({
        ...updatedContent,
        body,
        updatedAt: new Date()
      });

      return createContentAggregate(contentWithNewBody);
    },

    updateMetadata(metadata: ContentMetadata): ContentAggregate {
      // バージョンを作成
      const version = createVersion({
        id: generateId(),
        contentId: this.content.id,
        commitId: generateId(), // 実際の実装ではGitHubのコミットIDを使用
        createdAt: new Date(),
        changes: {
          metadata
        }
      });

      // コンテンツを更新
      const updatedContent = this.content.addVersion(version);
      
      // メタデータを更新したコンテンツを作成
      const contentWithNewMetadata = createContent({
        ...updatedContent,
        metadata,
        updatedAt: new Date()
      });

      return createContentAggregate(contentWithNewMetadata);
    },

    publish(): ContentAggregate {
      const updatedContent = this.content.changeVisibility("public");
      return createContentAggregate(updatedContent);
    },

    makePrivate(): ContentAggregate {
      const updatedContent = this.content.changeVisibility("private");
      return createContentAggregate(updatedContent);
    },

    makeUnlisted(): ContentAggregate {
      const updatedContent = this.content.changeVisibility("unlisted");
      return createContentAggregate(updatedContent);
    }
  };

  return Object.freeze(aggregate);
} 