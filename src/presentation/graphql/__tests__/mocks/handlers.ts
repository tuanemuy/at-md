/**
 * GraphQLテスト用のモックハンドラー
 * 
 * テスト用のクエリハンドラーとコマンドハンドラーを提供します。
 */

import { ok, err } from "neverthrow";

// モックユーザーデータ
const mockUsers = [
  {
    id: "user-1",
    username: "testuser",
    email: "test@example.com",
    atDid: "did:plc:abcdef123456",
    atHandle: "testuser.bsky.social",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "user-2",
    username: "anotheruser",
    email: "another@example.com",
    atDid: null,
    atHandle: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// モックコンテンツデータ
const mockContents = [
  {
    id: "content-1",
    userId: "user-1",
    repositoryId: "repo-1",
    path: "docs/example.md",
    title: "Example Document",
    body: "# Example\n\nThis is an example document.",
    visibility: "public",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// モックリポジトリデータ
const mockRepositories = [
  {
    id: "repo-1",
    userId: "user-1",
    name: "example-repo",
    description: "An example repository",
    url: "https://github.com/user/example-repo",
    provider: "github",
    isPublic: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// モックフィードデータ
const mockFeeds = [
  {
    id: "feed-1",
    userId: "user-1",
    name: "My Blog",
    slug: "my-blog",
    description: "My personal blog",
    tags: ["blog", "personal"],
    isPublic: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// モック投稿データ
const mockPosts = [
  {
    id: "post-1",
    feedId: "feed-1",
    contentId: "content-1",
    status: "published",
    publishedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// モックページデータ
const mockPages = [
  {
    id: "page-1",
    userId: "user-1",
    title: "About Me",
    slug: "about",
    contentId: "content-1",
    templateId: "template-1",
    isPublic: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// モックテンプレートデータ
const mockTemplates = [
  {
    id: "template-1",
    userId: "user-1",
    name: "Blog Post",
    description: "A simple blog post template",
    content: "<div>{{ content }}</div>",
    isPublic: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// モッククエリハンドラー
export const mockQueryHandlers = {
  // ユーザー関連
  getUserByIdQueryHandler: {
    execute: ({ id }: { name: string; id: string }) => {
      const user = mockUsers.find((u) => u.id === id);
      return user ? ok(user) : err(new Error("User not found"));
    },
  },
  getUserByUsernameQueryHandler: {
    execute: ({ username }: { name: string; username: string }) => {
      const user = mockUsers.find((u) => u.username === username);
      return user ? ok(user) : err(new Error("User not found"));
    },
  },
  getUserByEmailQueryHandler: {
    execute: ({ email }: { name: string; email: string }) => {
      const user = mockUsers.find((u) => u.email === email);
      return user ? ok(user) : err(new Error("User not found"));
    },
  },
  getUserByDidQueryHandler: {
    execute: ({ did }: { name: string; did: string }) => {
      const user = mockUsers.find((u) => u.atDid === did);
      return user ? ok(user) : err(new Error("User not found"));
    },
  },
  getUserByHandleQueryHandler: {
    execute: ({ handle }: { name: string; handle: string }) => {
      const user = mockUsers.find((u) => u.atHandle === handle);
      return user ? ok(user) : err(new Error("User not found"));
    },
  },

  // コンテンツ関連
  getContentByIdQueryHandler: {
    execute: ({ id }: { name: string; id: string }) => {
      const content = mockContents.find((c) => c.id === id);
      return content ? ok(content) : err(new Error("Content not found"));
    },
  },
  getContentsByUserIdQueryHandler: {
    execute: ({ userId }: { name: string; userId: string }) => {
      const contents = mockContents.filter((c) => c.userId === userId);
      return ok(contents);
    },
  },
  getContentsByRepositoryIdQueryHandler: {
    execute: ({ repositoryId }: { name: string; repositoryId: string }) => {
      const contents = mockContents.filter((c) => c.repositoryId === repositoryId);
      return ok(contents);
    },
  },
  getContentMetadataByContentIdQueryHandler: {
    execute: ({ contentId }: { name: string; contentId: string }) => {
      return ok({
        id: "metadata-1",
        contentId,
        type: "article",
        language: "en",
        severity: "normal",
        tags: ["test"],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    },
  },
  getRepositoryByIdQueryHandler: {
    execute: ({ id }: { name: string; id: string }) => {
      const repository = mockRepositories.find((r) => r.id === id);
      return repository ? ok(repository) : err(new Error("Repository not found"));
    },
  },
  getRepositoriesByUserIdQueryHandler: {
    execute: ({ userId }: { name: string; userId: string }) => {
      const repositories = mockRepositories.filter((r) => r.userId === userId);
      return ok(repositories);
    },
  },

  // フィード関連
  getFeedByIdQueryHandler: {
    execute: ({ id }: { name: string; id: string }) => {
      const feed = mockFeeds.find((f) => f.id === id);
      return feed ? ok(feed) : err(new Error("Feed not found"));
    },
  },
  getFeedByNameQueryHandler: {
    execute: ({ userId, feedName }: { name: string; userId: string; feedName: string }) => {
      const feed = mockFeeds.find((f) => f.userId === userId && f.name === feedName);
      return feed ? ok(feed) : err(new Error("Feed not found"));
    },
  },
  getFeedsByUserIdQueryHandler: {
    execute: ({ userId }: { name: string; userId: string }) => {
      const feeds = mockFeeds.filter((f) => f.userId === userId);
      return ok(feeds);
    },
  },
  getPostByIdQueryHandler: {
    execute: ({ id }: { name: string; id: string }) => {
      const post = mockPosts.find((p) => p.id === id);
      return post ? ok(post) : err(new Error("Post not found"));
    },
  },
  getPostByContentIdQueryHandler: {
    execute: ({ contentId }: { name: string; contentId: string }) => {
      const post = mockPosts.find((p) => p.contentId === contentId);
      return post ? ok(post) : err(new Error("Post not found"));
    },
  },
  getPostsByUserIdQueryHandler: {
    execute: ({ userId }: { name: string; userId: string }) => {
      const userFeeds = mockFeeds.filter((f) => f.userId === userId).map((f) => f.id);
      const posts = mockPosts.filter((p) => userFeeds.includes(p.feedId));
      return ok(posts);
    },
  },
  getPostsByFeedIdQueryHandler: {
    execute: ({ feedId }: { name: string; feedId: string }) => {
      const posts = mockPosts.filter((p) => p.feedId === feedId);
      return ok(posts);
    },
  },

  // 表示関連
  getPageByIdQueryHandler: {
    execute: ({ id }: { name: string; id: string }) => {
      const page = mockPages.find((p) => p.id === id);
      return page ? ok(page) : err(new Error("Page not found"));
    },
  },
  getPageBySlugQueryHandler: {
    execute: ({ slug }: { name: string; slug: string }) => {
      const page = mockPages.find((p) => p.slug === slug);
      return page ? ok(page) : err(new Error("Page not found"));
    },
  },
  getPageByContentIdQueryHandler: {
    execute: ({ contentId }: { name: string; contentId: string }) => {
      const page = mockPages.find((p) => p.contentId === contentId);
      return page ? ok(page) : err(new Error("Page not found"));
    },
  },
  getPagesByUserIdQueryHandler: {
    execute: ({ userId }: { name: string; userId: string }) => {
      const pages = mockPages.filter((p) => p.userId === userId);
      return ok(pages);
    },
  },
  getPagesByTemplateIdQueryHandler: {
    execute: ({ templateId }: { name: string; templateId: string }) => {
      const pages = mockPages.filter((p) => p.templateId === templateId);
      return ok(pages);
    },
  },
  getTemplateByIdQueryHandler: {
    execute: ({ id }: { name: string; id: string }) => {
      const template = mockTemplates.find((t) => t.id === id);
      return template ? ok(template) : err(new Error("Template not found"));
    },
  },
  getAllTemplatesQueryHandler: {
    execute: () => {
      return ok(mockTemplates);
    },
  },
};

// モックコマンドハンドラー
export const mockCommandHandlers = {
  // ユーザー関連
  createUserCommandHandler: {
    execute: (command: any) => {
      const newUser = {
        id: `user-${mockUsers.length + 1}`,
        username: command.username,
        email: command.email,
        atDid: command.atDid || null,
        atHandle: command.atHandle || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      return ok(newUser);
    },
  },
  updateUserCommandHandler: {
    execute: (command: any) => {
      const user = mockUsers.find((u) => u.id === command.id);
      if (!user) {
        return err(new Error("User not found"));
      }
      const updatedUser = { ...user };
      if (command.username) updatedUser.username = command.username;
      if (command.email) updatedUser.email = command.email;
      if (command.atDid !== undefined) updatedUser.atDid = command.atDid;
      if (command.atHandle !== undefined) updatedUser.atHandle = command.atHandle;
      updatedUser.updatedAt = new Date().toISOString();
      return ok(updatedUser);
    },
  },
  deleteUserCommandHandler: {
    execute: ({ id }: { name: string; id: string }) => {
      const userIndex = mockUsers.findIndex((u) => u.id === id);
      if (userIndex === -1) {
        return err(new Error("User not found"));
      }
      return ok(true);
    },
  },

  // コンテンツ関連
  createContentCommandHandler: {
    execute: (command: any) => {
      const newContent = {
        id: `content-${mockContents.length + 1}`,
        userId: command.userId,
        repositoryId: command.repositoryId,
        path: command.path,
        title: command.title,
        body: command.body,
        visibility: command.visibility,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      return ok(newContent);
    },
  },
  updateContentCommandHandler: {
    execute: (command: any) => {
      const content = mockContents.find((c) => c.id === command.id);
      if (!content) {
        return err(new Error("Content not found"));
      }
      const updatedContent = { ...content };
      if (command.path) updatedContent.path = command.path;
      if (command.title) updatedContent.title = command.title;
      if (command.body) updatedContent.body = command.body;
      if (command.visibility) updatedContent.visibility = command.visibility;
      updatedContent.updatedAt = new Date().toISOString();
      return ok(updatedContent);
    },
  },
  deleteContentCommandHandler: {
    execute: ({ id }: { name: string; id: string }) => {
      const contentIndex = mockContents.findIndex((c) => c.id === id);
      if (contentIndex === -1) {
        return err(new Error("Content not found"));
      }
      return ok(true);
    },
  },
  createRepositoryCommandHandler: {
    execute: (command: any) => {
      const newRepository = {
        id: `repo-${mockRepositories.length + 1}`,
        userId: command.userId,
        name: command.name,
        description: command.description || "",
        url: command.url || "",
        provider: command.provider,
        isPublic: command.isPublic,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      return ok(newRepository);
    },
  },
  updateRepositoryCommandHandler: {
    execute: (command: any) => {
      const repository = mockRepositories.find((r) => r.id === command.id);
      if (!repository) {
        return err(new Error("Repository not found"));
      }
      const updatedRepository = { ...repository };
      if (command.name) updatedRepository.name = command.name;
      if (command.description !== undefined) updatedRepository.description = command.description;
      if (command.url !== undefined) updatedRepository.url = command.url;
      if (command.isPublic !== undefined) updatedRepository.isPublic = command.isPublic;
      updatedRepository.updatedAt = new Date().toISOString();
      return ok(updatedRepository);
    },
  },
  deleteRepositoryCommandHandler: {
    execute: ({ id }: { name: string; id: string }) => {
      const repositoryIndex = mockRepositories.findIndex((r) => r.id === id);
      if (repositoryIndex === -1) {
        return err(new Error("Repository not found"));
      }
      return ok(true);
    },
  },

  // フィード関連
  createFeedCommandHandler: {
    execute: (command: any) => {
      const newFeed = {
        id: `feed-${mockFeeds.length + 1}`,
        userId: command.userId,
        name: command.name,
        slug: command.slug,
        description: command.description || "",
        tags: command.tags || [],
        isPublic: command.isPublic,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      return ok(newFeed);
    },
  },
  updateFeedCommandHandler: {
    execute: (command: any) => {
      const feed = mockFeeds.find((f) => f.id === command.id);
      if (!feed) {
        return err(new Error("Feed not found"));
      }
      const updatedFeed = { ...feed };
      if (command.name) updatedFeed.name = command.name;
      if (command.slug) updatedFeed.slug = command.slug;
      if (command.description !== undefined) updatedFeed.description = command.description;
      if (command.tags) updatedFeed.tags = command.tags;
      if (command.isPublic !== undefined) updatedFeed.isPublic = command.isPublic;
      updatedFeed.updatedAt = new Date().toISOString();
      return ok(updatedFeed);
    },
  },
  deleteFeedCommandHandler: {
    execute: ({ id }: { name: string; id: string }) => {
      const feedIndex = mockFeeds.findIndex((f) => f.id === id);
      if (feedIndex === -1) {
        return err(new Error("Feed not found"));
      }
      return ok(true);
    },
  },
  createPostCommandHandler: {
    execute: (command: any) => {
      const newPost = {
        id: `post-${mockPosts.length + 1}`,
        feedId: command.feedId,
        contentId: command.contentId,
        status: command.status,
        publishedAt: command.publishedAt || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      return ok(newPost);
    },
  },
  updatePostCommandHandler: {
    execute: (command: any) => {
      const post = mockPosts.find((p) => p.id === command.id);
      if (!post) {
        return err(new Error("Post not found"));
      }
      const updatedPost = { ...post };
      if (command.status) updatedPost.status = command.status;
      if (command.publishedAt !== undefined) updatedPost.publishedAt = command.publishedAt;
      updatedPost.updatedAt = new Date().toISOString();
      return ok(updatedPost);
    },
  },
  deletePostCommandHandler: {
    execute: ({ id }: { name: string; id: string }) => {
      const postIndex = mockPosts.findIndex((p) => p.id === id);
      if (postIndex === -1) {
        return err(new Error("Post not found"));
      }
      return ok(true);
    },
  },
  publishPostCommandHandler: {
    execute: ({ id }: { name: string; id: string }) => {
      const post = mockPosts.find((p) => p.id === id);
      if (!post) {
        return err(new Error("Post not found"));
      }
      const updatedPost = { ...post, status: "published", publishedAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      return ok(updatedPost);
    },
  },
  unpublishPostCommandHandler: {
    execute: ({ id }: { name: string; id: string }) => {
      const post = mockPosts.find((p) => p.id === id);
      if (!post) {
        return err(new Error("Post not found"));
      }
      const updatedPost = { ...post, status: "draft", updatedAt: new Date().toISOString() };
      return ok(updatedPost);
    },
  },

  // 表示関連
  createPageCommandHandler: {
    execute: (command: any) => {
      const newPage = {
        id: `page-${mockPages.length + 1}`,
        userId: command.userId,
        title: command.title,
        slug: command.slug,
        contentId: command.contentId || null,
        templateId: command.templateId || null,
        isPublic: command.isPublic,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      return ok(newPage);
    },
  },
  updatePageCommandHandler: {
    execute: (command: any) => {
      const page = mockPages.find((p) => p.id === command.id);
      if (!page) {
        return err(new Error("Page not found"));
      }
      const updatedPage = { ...page };
      if (command.title) updatedPage.title = command.title;
      if (command.slug) updatedPage.slug = command.slug;
      if (command.contentId !== undefined) updatedPage.contentId = command.contentId;
      if (command.templateId !== undefined) updatedPage.templateId = command.templateId;
      if (command.isPublic !== undefined) updatedPage.isPublic = command.isPublic;
      updatedPage.updatedAt = new Date().toISOString();
      return ok(updatedPage);
    },
  },
  deletePageCommandHandler: {
    execute: ({ id }: { name: string; id: string }) => {
      const pageIndex = mockPages.findIndex((p) => p.id === id);
      if (pageIndex === -1) {
        return err(new Error("Page not found"));
      }
      return ok(true);
    },
  },
  createTemplateCommandHandler: {
    execute: (command: any) => {
      const newTemplate = {
        id: `template-${mockTemplates.length + 1}`,
        userId: command.userId,
        name: command.name,
        description: command.description || "",
        content: command.content,
        isPublic: command.isPublic,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      return ok(newTemplate);
    },
  },
  updateTemplateCommandHandler: {
    execute: (command: any) => {
      const template = mockTemplates.find((t) => t.id === command.id);
      if (!template) {
        return err(new Error("Template not found"));
      }
      const updatedTemplate = { ...template };
      if (command.name) updatedTemplate.name = command.name;
      if (command.description !== undefined) updatedTemplate.description = command.description;
      if (command.content) updatedTemplate.content = command.content;
      if (command.isPublic !== undefined) updatedTemplate.isPublic = command.isPublic;
      updatedTemplate.updatedAt = new Date().toISOString();
      return ok(updatedTemplate);
    },
  },
  deleteTemplateCommandHandler: {
    execute: ({ id }: { name: string; id: string }) => {
      const templateIndex = mockTemplates.findIndex((t) => t.id === id);
      if (templateIndex === -1) {
        return err(new Error("Template not found"));
      }
      return ok(true);
    },
  },
}; 