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
export {
  type PostAggregateProps,
  type PostAggregate,
  type CreatePostAggregateParams,
  createPostAggregate,
  createNewPostAggregate
} from "./aggregates/post-aggregate.ts";

export {
  type FeedAggregateProps,
  type FeedAggregate,
  type CreateFeedAggregateParams,
  createFeedAggregate,
  createNewFeedAggregate
} from "./aggregates/feed-aggregate.ts";

// サービス
export { PublishingService } from "./services/publishing-service.ts"; 