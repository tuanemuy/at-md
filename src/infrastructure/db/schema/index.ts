// ユーザー関連
export * from "./users";

// 文書関連
export * from "./documents";

// 投稿関連
export * from "./posts";

// 共通
export * from "./common";

import { relations } from "drizzle-orm";
import { users, githubConnections } from "./users";
import { githubRepos, documents, tags, documentTags } from "./documents";
import { posts } from "./posts";

// リレーションシップの定義
export const usersRelations = relations(users, ({ many }) => ({
  githubConnections: many(githubConnections),
  repositories: many(githubRepos),
  documents: many(documents),
  tags: many(tags),
}));

export const githubConnectionsRelations = relations(
  githubConnections,
  ({ one }) => ({
    user: one(users, {
      fields: [githubConnections.userId],
      references: [users.id],
    }),
  }),
);

export const githubReposRelations = relations(githubRepos, ({ one, many }) => ({
  user: one(users, {
    fields: [githubRepos.userId],
    references: [users.id],
  }),
  documents: many(documents),
}));

export const documentsRelations = relations(documents, ({ one, many }) => ({
  repository: one(githubRepos, {
    fields: [documents.gitHubRepoId],
    references: [githubRepos.id],
  }),
  user: one(users, {
    fields: [documents.userId],
    references: [users.id],
  }),
  documentTags: many(documentTags),
  post: many(posts),
}));

export const postsRelations = relations(posts, ({ one }) => ({
  document: one(documents, {
    fields: [posts.documentId],
    references: [documents.id],
  }),
  user: one(users, {
    fields: [posts.userId],
    references: [users.id],
  }),
}));

export const tagsRelations = relations(tags, ({ one, many }) => ({
  user: one(users, {
    fields: [tags.userId],
    references: [users.id],
  }),
  documentTags: many(documentTags),
}));

export const documentTagsRelations = relations(documentTags, ({ one }) => ({
  document: one(documents, {
    fields: [documentTags.documentId],
    references: [documents.id],
  }),
  tag: one(tags, {
    fields: [documentTags.tagId],
    references: [tags.id],
  }),
}));
