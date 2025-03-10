/**
 * 表示ドメインのGraphQLスキーマ
 * 
 * 表示関連の型定義とクエリ、ミューテーションを定義します。
 */

import { gql } from "npm:graphql-tag";

export const displayTypeDefs = gql`
  extend type Query {
    page(id: ID!): Page
    pageBySlug(slug: String!): Page
    pageByContentId(contentId: ID!): Page
    pagesByUserId(userId: ID!, limit: Int, offset: Int): [Page!]!
    template(id: ID!): Template
    allTemplates: [Template!]!
  }

  extend type Mutation {
    createPage(input: CreatePageInput!): PageResult!
    updatePage(id: ID!, input: UpdatePageInput!): PageResult!
    deletePage(id: ID!): Boolean!
    createTemplate(input: CreateTemplateInput!): TemplateResult!
    updateTemplate(id: ID!, input: UpdateTemplateInput!): TemplateResult!
    deleteTemplate(id: ID!): Boolean!
  }

  type Page {
    id: ID!
    userId: ID!
    title: String!
    slug: String!
    contentId: ID
    templateId: ID
    isPublic: Boolean!
    createdAt: String!
    updatedAt: String!
    user: User
    content: Content
    template: Template
  }

  type Template {
    id: ID!
    userId: ID!
    name: String!
    description: String
    content: String!
    isPublic: Boolean!
    createdAt: String!
    updatedAt: String!
    user: User
    pages: [Page!]
  }

  input CreatePageInput {
    userId: ID!
    title: String!
    slug: String!
    contentId: ID
    templateId: ID
    isPublic: Boolean!
  }

  input UpdatePageInput {
    title: String
    slug: String
    contentId: ID
    templateId: ID
    isPublic: Boolean
  }

  input CreateTemplateInput {
    userId: ID!
    name: String!
    description: String
    content: String!
    isPublic: Boolean!
  }

  input UpdateTemplateInput {
    name: String
    description: String
    content: String
    isPublic: Boolean
  }

  type PageResult {
    success: Boolean!
    message: String
    page: Page
  }

  type TemplateResult {
    success: Boolean!
    message: String
    template: Template
  }
`; 