/**
 * コンテンツ関連のドメインイベント
 * 
 * このモジュールは、コンテンツドメインに関連するドメインイベントを定義します。
 * これらのイベントは、コンテンツの作成、更新、削除などの重要な操作を通知するために使用されます。
 */

import { DomainEvent } from "../../common/events/domain-event.ts";
import { Content } from "../entities/content.ts";

/**
 * コンテンツ作成イベント
 * コンテンツが新規作成された際に発行されるイベント
 */
export class ContentCreatedEvent implements DomainEvent {
  /** イベントタイプ */
  readonly eventType = "ContentCreated";
  
  /** イベント発生日時 */
  readonly occurredAt: Date;
  
  /** 作成されたコンテンツのID */
  readonly contentId: string;
  
  /** コンテンツを作成したユーザーのID */
  readonly userId: string;
  
  /** コンテンツのリポジトリID */
  readonly repositoryId: string;
  
  /** コンテンツのパス */
  readonly path: string;
  
  /**
   * コンストラクタ
   * @param content 作成されたコンテンツ
   */
  constructor(content: Content) {
    this.contentId = content.id;
    this.userId = content.userId;
    this.repositoryId = content.repositoryId;
    this.path = content.path;
    this.occurredAt = new Date();
  }
}

/**
 * コンテンツ更新イベント
 * コンテンツが更新された際に発行されるイベント
 */
export class ContentUpdatedEvent implements DomainEvent {
  /** イベントタイプ */
  readonly eventType = "ContentUpdated";
  
  /** イベント発生日時 */
  readonly occurredAt: Date;
  
  /** 更新されたコンテンツのID */
  readonly contentId: string;
  
  /** コンテンツを更新したユーザーのID */
  readonly userId: string;
  
  /** 更新されたフィールド */
  readonly updatedFields: string[];
  
  /**
   * コンストラクタ
   * @param content 更新されたコンテンツ
   * @param updatedFields 更新されたフィールドの配列
   */
  constructor(content: Content, updatedFields: string[]) {
    this.contentId = content.id;
    this.userId = content.userId;
    this.updatedFields = updatedFields;
    this.occurredAt = new Date();
  }
}

/**
 * コンテンツ削除イベント
 * コンテンツが削除された際に発行されるイベント
 */
export class ContentDeletedEvent implements DomainEvent {
  /** イベントタイプ */
  readonly eventType = "ContentDeleted";
  
  /** イベント発生日時 */
  readonly occurredAt: Date;
  
  /** 削除されたコンテンツのID */
  readonly contentId: string;
  
  /** コンテンツを削除したユーザーのID */
  readonly userId: string;
  
  /** コンテンツのリポジトリID */
  readonly repositoryId: string;
  
  /**
   * コンストラクタ
   * @param contentId 削除されたコンテンツのID
   * @param userId 削除を実行したユーザーのID
   * @param repositoryId コンテンツのリポジトリID
   */
  constructor(contentId: string, userId: string, repositoryId: string) {
    this.contentId = contentId;
    this.userId = userId;
    this.repositoryId = repositoryId;
    this.occurredAt = new Date();
  }
}

/**
 * コンテンツ公開イベント
 * コンテンツが公開された際に発行されるイベント
 */
export class ContentPublishedEvent implements DomainEvent {
  /** イベントタイプ */
  readonly eventType = "ContentPublished";
  
  /** イベント発生日時 */
  readonly occurredAt: Date;
  
  /** 公開されたコンテンツのID */
  readonly contentId: string;
  
  /** コンテンツを公開したユーザーのID */
  readonly userId: string;
  
  /** コンテンツのリポジトリID */
  readonly repositoryId: string;
  
  /** コンテンツのパス */
  readonly path: string;
  
  /**
   * コンストラクタ
   * @param content 公開されたコンテンツ
   */
  constructor(content: Content) {
    this.contentId = content.id;
    this.userId = content.userId;
    this.repositoryId = content.repositoryId;
    this.path = content.path;
    this.occurredAt = new Date();
  }
} 