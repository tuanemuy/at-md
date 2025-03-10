/**
 * GraphQLスキーマのエントリーポイント
 * 
 * 各ドメインのスキーマを統合して、アプリケーション全体のスキーマを定義します。
 */

import { gql } from "npm:graphql-tag";

// 基本的な型定義
const baseTypeDefs = gql`
  type Query {
    _empty: String
  }

  type Mutation {
    _empty: String
  }

  type Subscription {
    _empty: String
  }
`;

// 各ドメインのスキーマをインポート
import { userTypeDefs } from "./user.ts";
import { contentTypeDefs } from "./content.ts";
import { feedTypeDefs } from "./feed.ts";
import { displayTypeDefs } from "./display.ts";

// すべてのスキーマを結合
export const typeDefs = [
  baseTypeDefs,
  userTypeDefs,
  contentTypeDefs,
  feedTypeDefs,
  displayTypeDefs,
]; 