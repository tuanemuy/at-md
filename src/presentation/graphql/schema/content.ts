/**
 * コンテンツドメインのGraphQLスキーマ
 * 
 * コンテンツ関連の型定義とクエリ、ミューテーションを定義します。
 */

import { gql } from "../deps.ts";

export const contentTypeDefs = gql`
  extend type Query {
    content(id: ID!): Content
    contentsByUserId(userId: ID!, limit: Int, offset: Int): [Content!]!
    repository(id: ID!): Repository
    repositoriesByUserId(userId: ID!, limit: Int, offset: Int): [Repository!]!
  }

  extend type Mutation {
    createContent(input: CreateContentInput!): ContentResult!
    updateContent(id: ID!, input: UpdateContentInput!): ContentResult!
    deleteContent(id: ID!): Boolean!
    createRepository(input: CreateRepositoryInput!): RepositoryResult!
    updateRepository(id: ID!, input: UpdateRepositoryInput!): RepositoryResult!
    deleteRepository(id: ID!): Boolean!
  }

  type Content {
    id: ID!
    userId: ID!
    repositoryId: ID!
    path: String!
    title: String!
    body: String!
    visibility: String!
    createdAt: String!
    updatedAt: String!
    metadata: ContentMetadata
    user: User
    repository: Repository
  }

  type ContentMetadata {
    id: ID!
    contentId: ID!
    type: String
    language: String
    severity: String
    tags: [String!]
    createdAt: String!
    updatedAt: String!
  }

  type Repository {
    id: ID!
    userId: ID!
    name: String!
    description: String
    url: String
    provider: String!
    isPublic: Boolean!
    createdAt: String!
    updatedAt: String!
    user: User
    contents: [Content!]
  }

  input CreateContentInput {
    userId: ID!
    repositoryId: ID!
    path: String!
    title: String!
    body: String!
    visibility: String!
    metadata: ContentMetadataInput
  }

  input UpdateContentInput {
    path: String
    title: String
    body: String
    visibility: String
    metadata: ContentMetadataInput
  }

  input ContentMetadataInput {
    type: String
    language: String
    severity: String
    tags: [String!]
  }

  input CreateRepositoryInput {
    userId: ID!
    name: String!
    description: String
    url: String
    provider: String!
    isPublic: Boolean!
  }

  input UpdateRepositoryInput {
    name: String
    description: String
    url: String
    isPublic: Boolean
  }

  type ContentResult {
    success: Boolean!
    message: String
    content: Content
  }

  type RepositoryResult {
    success: Boolean!
    message: String
    repository: Repository
  }
`; 