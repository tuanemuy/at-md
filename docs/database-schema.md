# データベーススキーマ

この資料では、システムで使用するデータベーススキーマを定義します。Drizzle ORMを使用して実装します。

## スキーマ定義

```typescript
// src/infrastructure/db/schema/index.ts
import { pgTable, serial, text, timestamp, uuid, varchar, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ユーザーテーブル
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  did: varchar('did', { length: 255 }).notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// GitHub連携テーブル
export const githubConnections = pgTable('github_connections', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  installationId: varchar('installation_id', { length: 255 }).notNull(),
  accessToken: varchar('access_token', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// GitHubリポジトリテーブル
export const githubRepos = pgTable('github_repos', {
  id: uuid('id').primaryKey().defaultRandom(),
  owner: varchar('owner', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  fullName: varchar('full_name', { length: 255 }).notNull().unique(),
  installationId: varchar('installation_id', { length: 255 }).notNull(),
  webhookSecret: varchar('webhook_secret', { length: 255 }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// 文書テーブル
export const documents = pgTable('documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  gitHubRepoId: uuid('github_repo_id').notNull().references(() => githubRepos.id, { onDelete: 'cascade' }),
  path: varchar('path', { length: 255 }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: varchar('description', { length: 500 }),
  content: text('content').notNull(),
  scope: varchar('scope', { length: 50 }).notNull().default('private'),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// タグテーブル
export const tags = pgTable('tags', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// 文書タグ関連テーブル
export const documentTags = pgTable('document_tags', {
  id: uuid('id').primaryKey().defaultRandom(),
  documentId: uuid('document_id').notNull().references(() => documents.id, { onDelete: 'cascade' }),
  tagId: uuid('tag_id').notNull().references(() => tags.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

// 投稿テーブル
export const posts = pgTable('posts', {
  id: uuid('id').primaryKey().defaultRandom(),
  documentId: uuid('document_id').notNull().references(() => documents.id, { onDelete: 'cascade' }).unique(),
  uri: varchar('uri', { length: 255 }).default(''),
  status: varchar('status', { length: 50 }).notNull().default('pending'),
  error: text('error'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// リレーション定義
export const usersRelations = relations(users, ({ many }) => ({
  githubConnections: many(githubConnections),
  repositories: many(githubRepos),
  documents: many(documents),
  tags: many(tags)
}));

export const repositoriesRelations = relations(githubRepos, ({ one, many }) => ({
  user: one(users, {
    fields: [githubRepos.userId],
    references: [users.id]
  }),
  documents: many(documents)
}));

export const documentsRelations = relations(documents, ({ one, many }) => ({
  repository: one(githubRepos, {
    fields: [documents.gitHubRepoId],
    references: [githubRepos.id]
  }),
  user: one(users, {
    fields: [documents.userId],
    references: [users.id]
  }),
  post: one(posts, {
    fields: [documents.id],
    references: [posts.documentId]
  }),
  documentTags: many(documentTags)
}));

export const postsRelations = relations(posts, ({ one }) => ({
  document: one(documents, {
    fields: [posts.documentId],
    references: [documents.id]
  })
}));

export const tagsRelations = relations(tags, ({ one, many }) => ({
  user: one(users, {
    fields: [tags.userId],
    references: [users.id]
  }),
  documentTags: many(documentTags)
}));

export const documentTagsRelations = relations(documentTags, ({ one }) => ({
  document: one(documents, {
    fields: [documentTags.documentId],
    references: [documents.id]
  }),
  tag: one(tags, {
    fields: [documentTags.tagId],
    references: [tags.id]
  })
}));
```

## マイグレーション

```typescript
// src/infrastructure/db/migrations/0000_initial.ts
import { sql } from 'drizzle-orm';
import { pgTable, serial, text, timestamp, uuid, varchar, jsonb } from 'drizzle-orm/pg-core';

export async function up(db) {
  await db.schema
    .createTable('users')
    .addColumn('id', uuid('id').primaryKey().defaultRandom())
    .addColumn('name', varchar('name', { length: 255 }).notNull())
    .addColumn('did', varchar('did', { length: 255 }).notNull().unique())
    .addColumn('created_at', timestamp('created_at').defaultNow().notNull())
    .addColumn('updated_at', timestamp('updated_at').defaultNow().notNull())
    .execute();

  await db.schema
    .createTable('github_connections')
    .addColumn('id', uuid('id').primaryKey().defaultRandom())
    .addColumn('user_id', uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }))
    .addColumn('installation_id', varchar('installation_id', { length: 255 }).notNull())
    .addColumn('access_token', varchar('access_token', { length: 255 }))
    .addColumn('created_at', timestamp('created_at').defaultNow().notNull())
    .addColumn('updated_at', timestamp('updated_at').defaultNow().notNull())
    .execute();

  await db.schema
    .createTable('github_repos')
    .addColumn('id', uuid('id').primaryKey().defaultRandom())
    .addColumn('owner', varchar('owner', { length: 255 }).notNull())
    .addColumn('name', varchar('name', { length: 255 }).notNull())
    .addColumn('full_name', varchar('full_name', { length: 255 }).notNull().unique())
    .addColumn('installation_id', varchar('installation_id', { length: 255 }).notNull())
    .addColumn('webhook_secret', varchar('webhook_secret', { length: 255 }))
    .addColumn('user_id', uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }))
    .addColumn('created_at', timestamp('created_at').defaultNow().notNull())
    .addColumn('updated_at', timestamp('updated_at').defaultNow().notNull())
    .execute();

  await db.schema
    .createTable('documents')
    .addColumn('id', uuid('id').primaryKey().defaultRandom())
    .addColumn('github_repo_id', uuid('github_repo_id').notNull().references(() => github_repos.id, { onDelete: 'cascade' }))
    .addColumn('path', varchar('path', { length: 255 }).notNull())
    .addColumn('title', varchar('title', { length: 255 }).notNull())
    .addColumn('description', varchar('description', { length: 500 }))
    .addColumn('content', text('content').notNull())
    .addColumn('scope', varchar('scope', { length: 50 }).notNull().default('private'))
    .addColumn('user_id', uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }))
    .addColumn('created_at', timestamp('created_at').defaultNow().notNull())
    .addColumn('updated_at', timestamp('updated_at').defaultNow().notNull())
    .execute();

  await db.schema
    .createTable('tags')
    .addColumn('id', uuid('id').primaryKey().defaultRandom())
    .addColumn('name', varchar('name', { length: 255 }).notNull())
    .addColumn('user_id', uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }))
    .addColumn('created_at', timestamp('created_at').defaultNow().notNull())
    .addColumn('updated_at', timestamp('updated_at').defaultNow().notNull())
    .execute();

  await db.schema
    .createTable('document_tags')
    .addColumn('id', uuid('id').primaryKey().defaultRandom())
    .addColumn('document_id', uuid('document_id').notNull().references(() => documents.id, { onDelete: 'cascade' }))
    .addColumn('tag_id', uuid('tag_id').notNull().references(() => tags.id, { onDelete: 'cascade' }))
    .addColumn('created_at', timestamp('created_at').defaultNow().notNull())
    .execute();

  await db.schema
    .createTable('posts')
    .addColumn('id', uuid('id').primaryKey().defaultRandom())
    .addColumn('document_id', uuid('document_id').notNull().references(() => documents.id, { onDelete: 'cascade' }).unique())
    .addColumn('uri', varchar('uri', { length: 255 }).default(''))
    .addColumn('status', varchar('status', { length: 50 }).notNull().default('pending'))
    .addColumn('error', text('error'))
    .addColumn('created_at', timestamp('created_at').defaultNow().notNull())
    .addColumn('updated_at', timestamp('updated_at').defaultNow().notNull())
    .execute();

  // インデックスの作成
  await db.execute(sql`CREATE INDEX idx_github_connections_user_id ON github_connections (user_id)`);
  await db.execute(sql`CREATE INDEX idx_repositories_user_id ON github_repos (user_id)`);
  await db.execute(sql`CREATE INDEX idx_repositories_full_name ON github_repos (full_name)`);
  await db.execute(sql`CREATE INDEX idx_documents_repository_id ON documents (github_repo_id)`);
  await db.execute(sql`CREATE INDEX idx_documents_user_id ON documents (user_id)`);
  await db.execute(sql`CREATE UNIQUE INDEX idx_documents_repository_path ON documents (github_repo_id, path)`);
  await db.execute(sql`CREATE INDEX idx_posts_document_id ON posts (document_id)`);
  await db.execute(sql`CREATE INDEX idx_tags_user_id ON tags (user_id)`);
  await db.execute(sql`CREATE INDEX idx_document_tags_document_id ON document_tags (document_id)`);
  await db.execute(sql`CREATE INDEX idx_document_tags_tag_id ON document_tags (tag_id)`);
  await db.execute(sql`CREATE UNIQUE INDEX idx_document_tags_document_tag ON document_tags (document_id, tag_id)`);
}

export async function down(db) {
  await db.schema.dropTable('posts').execute();
  await db.schema.dropTable('document_tags').execute();
  await db.schema.dropTable('tags').execute();
  await db.schema.dropTable('documents').execute();
  await db.schema.dropTable('github_repos').execute();
  await db.schema.dropTable('github_connections').execute();
  await db.schema.dropTable('users').execute();
}
```

## リポジトリ実装例

```typescript
// src/infrastructure/db/repositories/user.ts
import { eq } from 'drizzle-orm';
import { Result, ok, err } from 'neverthrow';
import { db } from '../client';
import { users, githubConnections } from '../schema';
import { UserRepository } from '@/domain/repositories/user';
import { User, GitHubConnection } from '@/domain/models/user';
import { ID } from '@/domain/models/common';

export class DrizzleUserRepository implements UserRepository {
  async findById(id: ID): Promise<Result<User | null, Error>> {
    try {
      const result = await db.query.users.findFirst({
        where: eq(users.id, id),
        with: {
          githubConnections: true
        }
      });
      
      return ok(result ? this.mapToUser(result) : null);
    } catch (error) {
      return err(error instanceof Error ? error : new Error('Unknown error'));
    }
  }

  async findByDid(did: string): Promise<Result<User | null, Error>> {
    try {
      const result = await db.query.users.findFirst({
        where: eq(users.did, did),
        with: {
          githubConnections: true
        }
      });
      
      return ok(result ? this.mapToUser(result) : null);
    } catch (error) {
      return err(error instanceof Error ? error : new Error('Unknown error'));
    }
  }

  async save(user: User): Promise<Result<User, Error>> {
    try {
      const { githubConnections: connections, ...userData } = user;
      
      const result = await db.transaction(async (tx) => {
        // ユーザーを保存
        const [savedUser] = await tx
          .insert(users)
          .values({
            id: userData.id,
            name: userData.name,
            did: userData.did,
            createdAt: userData.createdAt,
            updatedAt: userData.updatedAt
          })
          .onConflictDoUpdate({
            target: users.id,
            set: {
              name: userData.name,
              updatedAt: new Date()
            }
          })
          .returning();
        
        return savedUser;
      });
      
      return ok({
        ...user,
        id: result.id,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt
      });
    } catch (error) {
      return err(error instanceof Error ? error : new Error('Unknown error'));
    }
  }

  async addGitHubConnection(userId: ID, connection: GitHubConnection): Promise<Result<GitHubConnection, Error>> {
    try {
      const [result] = await db
        .insert(githubConnections)
        .values({
          id: connection.id,
          userId,
          installationId: connection.installationId,
          accessToken: connection.accessToken,
          createdAt: connection.createdAt,
          updatedAt: connection.updatedAt
        })
        .onConflictDoUpdate({
          target: [githubConnections.userId, githubConnections.installationId],
          set: {
            accessToken: connection.accessToken,
            updatedAt: new Date()
          }
        })
        .returning();
      
      return ok({
        id: result.id,
        userId: result.userId,
        installationId: result.installationId,
        accessToken: result.accessToken,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt
      });
    } catch (error) {
      return err(error instanceof Error ? error : new Error('Unknown error'));
    }
  }

  private mapToUser(data: any): User {
    return {
      id: data.id,
      name: data.name,
      did: data.did,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      githubConnections: data.githubConnections.map((conn: any) => ({
        id: conn.id,
        userId: conn.userId,
        installationId: conn.installationId,
        accessToken: conn.accessToken,
        createdAt: conn.createdAt,
        updatedAt: conn.updatedAt
      }))
    };
  }
} 
