/**
 * 配信ドメイン
 * コンテンツを配信するための機能を提供します。
 */

// 値オブジェクト
export { 
  type PublishStatusType,
  type PublishStatusProps,
  type PublishStatus,
  createPublishStatus
} from "./value-objects/publish-status.ts";

export {
  type FeedType,
  type FeedMetadataProps,
  type FeedMetadata,
  createFeedMetadata
} from "./value-objects/feed-metadata.ts";

// エンティティ
export {
  type PostProps,
  type Post,
  createPost
} from "./entities/post.ts";

export {
  type FeedProps,
  type Feed,
  createFeed
} from "./entities/feed.ts";

// 集約
// TODO: PostAggregateとFeedAggregateを実装する

// サービス
// TODO: PublishingServiceを実装する 