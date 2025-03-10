/**
 * フィードドメインのGraphQLスキーマ
 * 
 * フィード関連の型定義とクエリ、ミューテーションを定義します。
 */

import { gql } from "../deps.ts";

export const feedTypeDefs = gql`
  extend type Query {
    feed(id: ID!): Feed
    feedByName(userId: ID!, name: String!): Feed
    feedsByUserId(userId: ID!, limit: Int, offset: Int): [Feed!]!
    post(id: ID!): Post
    postByContentId(contentId: ID!): Post
    postsByUserId(userId: ID!, limit: Int, offset: Int): [Post!]!
    postsByFeedId(feedId: ID!, limit: Int, offset: Int): [Post!]!
  }

  extend type Mutation {
    createFeed(input: CreateFeedInput!): FeedResult!
    updateFeed(id: ID!, input: UpdateFeedInput!): FeedResult!
    deleteFeed(id: ID!): Boolean!
    createPost(input: CreatePostInput!): PostResult!
    updatePost(id: ID!, input: UpdatePostInput!): PostResult!
    deletePost(id: ID!): Boolean!
    publishPost(id: ID!): PostResult!
    unpublishPost(id: ID!): PostResult!
  }

  type Feed {
    id: ID!
    userId: ID!
    name: String!
    slug: String!
    description: String
    tags: [String!]
    isPublic: Boolean!
    createdAt: String!
    updatedAt: String!
    user: User
    posts: [Post!]
  }

  type Post {
    id: ID!
    feedId: ID!
    contentId: ID!
    status: String!
    publishedAt: String
    createdAt: String!
    updatedAt: String!
    feed: Feed
    content: Content
  }

  input CreateFeedInput {
    userId: ID!
    name: String!
    slug: String!
    description: String
    tags: [String!]
    isPublic: Boolean!
  }

  input UpdateFeedInput {
    name: String
    slug: String
    description: String
    tags: [String!]
    isPublic: Boolean
  }

  input CreatePostInput {
    feedId: ID!
    contentId: ID!
    status: String!
    publishedAt: String
  }

  input UpdatePostInput {
    status: String
    publishedAt: String
  }

  type FeedResult {
    success: Boolean!
    message: String
    feed: Feed
  }

  type PostResult {
    success: Boolean!
    message: String
    post: Post
  }
`; 