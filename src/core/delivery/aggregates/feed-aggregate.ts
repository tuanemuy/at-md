/**
 * フィード集約
 * フィードの高レベル操作を提供します。
 */
import { Feed, createFeed, FeedProps } from "../entities/feed.ts";
import { FeedMetadataProps, createFeedMetadata } from "../value-objects/feed-metadata.ts";
import { generateId } from "../../common/id.ts";
import { InvalidPostStateError } from "../../errors/domain.ts";

/**
 * フィード集約のプロパティ
 */
export interface FeedAggregateProps {
  /**
   * フィードエンティティ
   */
  feed: Feed;
}

/**
 * フィード集約
 */
export interface FeedAggregate extends FeedAggregateProps {
  /**
   * フィード名を更新する
   * @param name 新しいフィード名
   * @returns 更新されたフィード集約
   */
  updateName(name: string): FeedAggregate;
  
  /**
   * メタデータを更新する
   * @param metadataProps 新しいメタデータのプロパティ
   * @returns 更新されたフィード集約
   */
  updateMetadata(metadataProps: FeedMetadataProps): FeedAggregate;
  
  /**
   * 投稿を追加する
   * @param postId 追加する投稿ID
   * @returns 更新されたフィード集約
   */
  addPost(postId: string): FeedAggregate;
  
  /**
   * 投稿を削除する
   * @param postId 削除する投稿ID
   * @returns 更新されたフィード集約
   */
  removePost(postId: string): FeedAggregate;
  
  /**
   * 投稿の順序を変更する
   * @param postIds 新しい順序の投稿IDリスト
   * @returns 更新されたフィード集約
   */
  reorderPosts(postIds: string[]): FeedAggregate;
  
  /**
   * 複数の投稿を追加する
   * @param postIds 追加する投稿IDのリスト
   * @returns 更新されたフィード集約
   */
  addPosts(postIds: string[]): FeedAggregate;
  
  /**
   * 複数の投稿を削除する
   * @param postIds 削除する投稿IDのリスト
   * @returns 更新されたフィード集約
   */
  removePosts(postIds: string[]): FeedAggregate;
  
  /**
   * フィードエンティティを取得する
   * @returns フィードエンティティ
   */
  getFeed(): Feed;
}

/**
 * 新しいフィード集約を作成するためのパラメータ
 */
export interface CreateFeedAggregateParams {
  /**
   * ユーザーID
   */
  userId: string;
  
  /**
   * フィード名
   */
  name: string;
  
  /**
   * フィードのメタデータのプロパティ
   */
  metadataProps: FeedMetadataProps;
}

/**
 * フィード集約を作成する
 * @param props フィード集約のプロパティ
 * @returns フィード集約
 */
export function createFeedAggregate(props: FeedAggregateProps): FeedAggregate {
  // フィード集約オブジェクトを作成
  const aggregate: FeedAggregate = {
    ...props,
    
    updateName(name: string): FeedAggregate {
      return createFeedAggregate({
        feed: this.feed.updateName(name)
      });
    },
    
    updateMetadata(metadataProps: FeedMetadataProps): FeedAggregate {
      return createFeedAggregate({
        feed: this.feed.updateMetadata(metadataProps)
      });
    },
    
    addPost(postId: string): FeedAggregate {
      return createFeedAggregate({
        feed: this.feed.addPost(postId)
      });
    },
    
    removePost(postId: string): FeedAggregate {
      return createFeedAggregate({
        feed: this.feed.removePost(postId)
      });
    },
    
    reorderPosts(postIds: string[]): FeedAggregate {
      return createFeedAggregate({
        feed: this.feed.reorderPosts(postIds)
      });
    },
    
    addPosts(postIds: string[]): FeedAggregate {
      // 投稿IDのリストが空の場合は何もしない
      if (!postIds || postIds.length === 0) {
        return this;
      }
      
      // 投稿を1つずつ追加
      let updatedFeed = this.feed;
      for (const postId of postIds) {
        updatedFeed = updatedFeed.addPost(postId);
      }
      
      return createFeedAggregate({
        feed: updatedFeed
      });
    },
    
    removePosts(postIds: string[]): FeedAggregate {
      // 投稿IDのリストが空の場合は何もしない
      if (!postIds || postIds.length === 0) {
        return this;
      }
      
      // 投稿を1つずつ削除
      let updatedFeed = this.feed;
      for (const postId of postIds) {
        updatedFeed = updatedFeed.removePost(postId);
      }
      
      return createFeedAggregate({
        feed: updatedFeed
      });
    },
    
    getFeed(): Feed {
      return this.feed;
    }
  };
  
  // 不変オブジェクトとして返す
  return Object.freeze(aggregate);
}

/**
 * 新しいフィード集約を作成する
 * @param params 新しいフィード集約を作成するためのパラメータ
 * @returns フィード集約
 */
export function createNewFeedAggregate(params: CreateFeedAggregateParams): FeedAggregate {
  // フィード名のバリデーション
  if (!params.name) {
    throw new InvalidPostStateError("無効な状態", "フィード名が指定されていません");
  }
  
  // メタデータのバリデーション
  if (!params.metadataProps) {
    throw new InvalidPostStateError("無効な状態", "メタデータが指定されていません");
  }
  
  // メタデータを作成
  const metadata = createFeedMetadata(params.metadataProps);
  
  // 新しいフィードエンティティを作成
  const feed = createFeed({
    id: generateId(),
    userId: params.userId,
    name: params.name,
    metadata,
    postIds: [],
    createdAt: new Date(),
    updatedAt: new Date()
  });
  
  // フィード集約を作成して返す
  return createFeedAggregate({
    feed
  });
} 