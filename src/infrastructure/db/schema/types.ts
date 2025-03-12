import type { InferSelectModel } from "drizzle-orm";
import type {
  users,
  githubConnections,
  documents,
  githubRepos,
  tags,
  documentTags,
  posts,
} from "./index";

// テーブルの型定義
export type UsersTable = InferSelectModel<typeof users>;
export type GitHubConnectionsTable = InferSelectModel<typeof githubConnections>;
export type DocumentsTable = InferSelectModel<typeof documents>;
export type GitHubReposTable = InferSelectModel<typeof githubRepos>;
export type TagsTable = InferSelectModel<typeof tags>;
export type DocumentTagsTable = InferSelectModel<typeof documentTags>;
export type PostsTable = InferSelectModel<typeof posts>;
