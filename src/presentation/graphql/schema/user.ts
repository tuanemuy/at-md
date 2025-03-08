/**
 * ユーザードメインのGraphQLスキーマ
 * 
 * ユーザー関連の型定義とクエリ、ミューテーションを定義します。
 */

import { default as gql } from "graphql-tag";

export const userTypeDefs = gql`
  extend type Query {
    user(id: ID!): User
    userByUsername(username: String!): User
    userByEmail(email: String!): User
    userByDid(did: String!): User
    userByHandle(handle: String!): User
  }

  extend type Mutation {
    createUser(input: CreateUserInput!): UserResult!
    updateUser(id: ID!, input: UpdateUserInput!): UserResult!
    deleteUser(id: ID!): Boolean!
  }

  type User {
    id: ID!
    username: String!
    email: String!
    atDid: String
    atHandle: String
    createdAt: String!
    updatedAt: String!
  }

  input CreateUserInput {
    username: String!
    email: String!
    atDid: String
    atHandle: String
  }

  input UpdateUserInput {
    username: String
    email: String
    atDid: String
    atHandle: String
  }

  type UserResult {
    success: Boolean!
    message: String
    user: User
  }
`; 