/**
 * フィードエンティティ
 * 
 * フィードの基本的な属性と振る舞いを定義します。
 */
import { FeedMetadata, createFeedMetadata, FeedMetadataProps } from "../value-objects/feed-metadata.ts";
import { DomainError, InvalidContentStateError, InvalidPostStateError } from "../../errors/mod.ts";

/**
 * フィードエンティティのプロパティ
 */
export interface FeedProps {
  /**
   * フィードID
   */
  id: string;
  
  /**
   * ユーザーID
   */
  userId: string;
  
  /**
   * フィード名
   */
  name: string;
  
  /**
   * フィードのメタデータ
   */
  metadata: FeedMetadata;
  
  /**
   * 投稿IDのリスト
   */
  postIds: string[];
  
  /**
   * 作成日時
   */
  createdAt: Date;
  
  /**
   * 更新日時
   */
  updatedAt: Date;
}

/**
 * フィードエンティティ
 */
export interface Feed extends FeedProps {
  /**
   * フィード名を更新する
   * @param name 新しいフィード名
   * @returns 更新されたフィード
   */
  updateName(name: string): Feed;
  
  /**
   * メタデータを更新する
   * @param metadataProps 新しいメタデータのプロパティ
   * @returns 更新されたフィード
   */
  updateMetadata(metadataProps: FeedMetadataProps): Feed;
  
  /**
   * 投稿を追加する
   * @param postId 追加する投稿ID
   * @returns 更新されたフィード
   */
  addPost(postId: string): Feed;
  
  /**
   * 投稿を削除する
   * @param postId 削除する投稿ID
   * @returns 更新されたフィード
   */
  removePost(postId: string): Feed;
  
  /**
   * 投稿の順序を変更する
   * @param postIds 新しい順序の投稿IDリスト
   * @returns 更新されたフィード
   */
  reorderPosts(postIds: string[]): Feed;
}

/**
 * フィードエンティティを作成する
 * @param props フィードのプロパティ
 * @returns フィードエンティティ
 * @throws {Error} 無効なフィードの場合
 */
export function createFeed(props: FeedProps): Feed {
  // バリデーション
  validateFeed(props);
  
  // フィードオブジェクトを作成
  const feed: Feed = {
    ...props,
    
    updateName(name: string): Feed {
      if (!name) {
        throw new InvalidPostStateError("空のフィード名", "フィード名の更新");
      }
      
      return createFeed({
        ...this,
        name,
        updatedAt: new Date()
      });
    },
    
    updateMetadata(metadataProps: FeedMetadataProps): Feed {
      return createFeed({
        ...this,
        metadata: createFeedMetadata(metadataProps),
        updatedAt: new Date()
      });
    },
    
    addPost(postId: string): Feed {
      if (!postId) {
        throw new InvalidPostStateError("空の投稿ID", "投稿の追加");
      }
      
      // 既に存在する場合は追加しない
      if (this.postIds.includes(postId)) {
        return this;
      }
      
      return createFeed({
        ...this,
        postIds: [...this.postIds, postId],
        updatedAt: new Date()
      });
    },
    
    removePost(postId: string): Feed {
      if (!postId) {
        throw new InvalidPostStateError("空の投稿ID", "投稿の削除");
      }
      
      // 投稿が存在しない場合は何もしない
      if (!this.postIds.includes(postId)) {
        return this;
      }
      
      // 新しい配列を作成して投稿を削除
      const newPostIds = this.postIds.filter(id => id !== postId);
      
      // 必ず新しい日時を生成
      const now = new Date();
      
      return createFeed({
        ...this,
        postIds: newPostIds,
        updatedAt: now
      });
    },
    
    reorderPosts(postIds: string[]): Feed {
      // 投稿IDのリストが現在のリストと同じ要素を含んでいるか確認
      if (postIds.length !== this.postIds.length || 
          !postIds.every(id => this.postIds.includes(id))) {
        throw new InvalidPostStateError("無効な投稿IDリスト", "投稿の順序変更");
      }
      
      // 順序が同じ場合は何もしない
      if (postIds.every((id, index) => id === this.postIds[index])) {
        return this;
      }
      
      // 必ず新しい日時を生成
      const now = new Date();
      
      return createFeed({
        ...this,
        postIds,
        updatedAt: now
      });
    }
  };
  
  // 不変オブジェクトとして返す
  return Object.freeze(feed);
}

/**
 * フィードのバリデーション
 * @param props フィードのプロパティ
 * @throws {Error} 無効なフィードの場合
 */
function validateFeed(props: FeedProps): void {
  // IDが必須
  if (!props.id) {
    throw new InvalidPostStateError("無効な状態", "フィードIDが指定されていません");
  }
  
  // ユーザーIDが必須
  if (!props.userId) {
    throw new InvalidPostStateError("無効な状態", "ユーザーIDが指定されていません");
  }
  
  // フィード名が必須
  if (!props.name) {
    throw new InvalidPostStateError("無効な状態", "フィード名が指定されていません");
  }
  
  // メタデータが必須
  if (!props.metadata) {
    throw new InvalidPostStateError("無効な状態", "メタデータが指定されていません");
  }
  
  // 投稿IDのリストが必須
  if (!props.postIds) {
    throw new InvalidPostStateError("無効な状態", "投稿IDのリストが指定されていません");
  }
} 