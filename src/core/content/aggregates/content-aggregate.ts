import { Content, createContent, DomainValidationError } from "../entities/content.ts";
import { ContentMetadata } from "../value-objects/content-metadata.ts";
import { Version, createVersion } from "../value-objects/version.ts";
import { generateId } from "../../common/id.ts";
import { Result, ok, err } from "../deps.ts";

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
  updateTitle(title: string): Result<ContentAggregate, DomainValidationError>;

  /**
   * 本文を更新する
   * @param body 新しい本文
   * @returns 新しいContentAggregateインスタンス
   */
  updateBody(body: string): Result<ContentAggregate, DomainValidationError>;

  /**
   * メタデータを更新する
   * @param metadata 新しいメタデータ
   * @returns 新しいContentAggregateインスタンス
   */
  updateMetadata(metadata: ContentMetadata): Result<ContentAggregate, DomainValidationError>;

  /**
   * コンテンツを公開する（public）
   * @returns 新しいContentAggregateインスタンス
   */
  publish(): Result<ContentAggregate, DomainValidationError>;

  /**
   * コンテンツを非公開にする（private）
   * @returns 新しいContentAggregateインスタンス
   */
  makePrivate(): Result<ContentAggregate, DomainValidationError>;

  /**
   * コンテンツを限定公開にする（unlisted）
   * @returns 新しいContentAggregateインスタンス
   */
  makeUnlisted(): Result<ContentAggregate, DomainValidationError>;
}

/**
 * コンテンツ集約を作成する
 * @param contentOrResult コンテンツエンティティまたはResult<Content, DomainValidationError>
 * @returns コンテンツ集約
 */
export function createContentAggregate(contentOrResult: Content | Result<Content, DomainValidationError>): ContentAggregate {
  // Resultオブジェクトの場合は中身を取り出す
  let content: Content;
  if (contentOrResult instanceof Object && 'isOk' in contentOrResult && typeof contentOrResult.isOk === 'function') {
    if (contentOrResult.isOk()) {
      content = contentOrResult._unsafeUnwrap();
    } else {
      throw contentOrResult.error;
    }
  } else {
    content = contentOrResult as Content;
  }

  return {
    content,

    updateTitle(title: string): Result<ContentAggregate, DomainValidationError> {
      if (!title || title.trim() === "") {
        return err(new DomainValidationError("タイトルは空にできません"));
      }

      // 新しいバージョンを作成
      const versionId = generateId();
      const version = createVersion({
        id: versionId,
        contentId: this.content.id,
        commitId: versionId, // 一時的なコミットID
        createdAt: new Date(),
        changes: {
          title
        }
      });

      try {
        // コンテンツを更新
        const updatedContent = this.content.addVersion(version);
        
        // 新しいアグリゲートを作成
        return ok(createContentAggregate(updatedContent));
      } catch (error) {
        if (error instanceof DomainValidationError) {
          return err(error);
        }
        return err(new DomainValidationError("タイトルの更新に失敗しました", error));
      }
    },

    updateBody(body: string): Result<ContentAggregate, DomainValidationError> {
      if (body === undefined || body === null) {
        return err(new DomainValidationError("本文はnullまたはundefinedにできません"));
      }

      // 新しいバージョンを作成
      const versionId = generateId();
      const version = createVersion({
        id: versionId,
        contentId: this.content.id,
        commitId: versionId, // 一時的なコミットID
        createdAt: new Date(),
        changes: {
          body
        }
      });

      try {
        // コンテンツを更新
        const updatedContent = this.content.addVersion(version);
        
        // 新しいアグリゲートを作成
        return ok(createContentAggregate(updatedContent));
      } catch (error) {
        if (error instanceof DomainValidationError) {
          return err(error);
        }
        return err(new DomainValidationError("本文の更新に失敗しました", error));
      }
    },

    updateMetadata(metadata: ContentMetadata): Result<ContentAggregate, DomainValidationError> {
      if (!metadata) {
        return err(new DomainValidationError("メタデータはnullまたはundefinedにできません"));
      }

      try {
        // コンテンツを更新
        const updatedContent = this.content.updateMetadata(metadata);
        
        // 新しいアグリゲートを作成
        return ok(createContentAggregate(updatedContent));
      } catch (error) {
        if (error instanceof DomainValidationError) {
          return err(error);
        }
        return err(new DomainValidationError("メタデータの更新に失敗しました", error));
      }
    },

    publish(): Result<ContentAggregate, DomainValidationError> {
      try {
        const updatedContent = this.content.changeVisibility("public");
        return ok(createContentAggregate(updatedContent));
      } catch (error) {
        if (error instanceof DomainValidationError) {
          return err(error);
        }
        return err(new DomainValidationError("公開設定の変更に失敗しました", error));
      }
    },

    makePrivate(): Result<ContentAggregate, DomainValidationError> {
      try {
        const updatedContent = this.content.changeVisibility("private");
        return ok(createContentAggregate(updatedContent));
      } catch (error) {
        if (error instanceof DomainValidationError) {
          return err(error);
        }
        return err(new DomainValidationError("公開設定の変更に失敗しました", error));
      }
    },

    makeUnlisted(): Result<ContentAggregate, DomainValidationError> {
      try {
        const updatedContent = this.content.changeVisibility("unlisted");
        return ok(createContentAggregate(updatedContent));
      } catch (error) {
        if (error instanceof DomainValidationError) {
          return err(error);
        }
        return err(new DomainValidationError("公開設定の変更に失敗しました", error));
      }
    }
  };
} 