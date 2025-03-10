/**
 * Honoアプリケーション
 * RESTful APIのエントリーポイントとなるHonoアプリケーションを提供します。
 */

import { Hono, cors } from "../deps.ts";
import { logger } from "hono/logger";
import { userRoutes } from "../routes/user-routes.ts";
import { contentRoutes } from "../routes/content-routes.ts";
import { feedRoutes } from "../routes/feed-routes.ts";
import { pageRoutes } from "../routes/page-routes.ts";
import { templateRoutes } from "../routes/template-routes.ts";

// アプリケーション層のクエリとコマンドハンドラー
import {
  GetUserByIdQueryHandler,
  CreateUserCommandHandler,
  GetContentByIdQueryHandler,
  CreateContentCommandHandler,
  GetFeedByIdQueryHandler,
  GetFeedsByUserIdQueryHandler,
  CreateFeedCommandHandler,
  GetPageByIdQueryHandler,
  GetPageBySlugQueryHandler,
  GetPageByContentIdQueryHandler,
  GetTemplateByIdQueryHandler,
  GetAllTemplatesQueryHandler
} from "../deps.ts";

// インフラストラクチャ層のリポジトリ
import {
  DrizzleUserRepository,
  DrizzleContentRepository,
  DrizzleRepositoryRepository,
  DrizzleFeedRepository,
  DrizzlePageRepository,
  DrizzleTemplateRepository,
  db
} from "../../deps.ts";

/**
 * REST APIアプリケーションを作成する
 * @returns Honoアプリケーション
 */
export function createApp(): Hono {
  const app = new Hono();

  // ミドルウェアの設定
  app.use("*", logger());
  app.use("*", cors());

  // リポジトリの作成
  const userRepository = new DrizzleUserRepository(db as any);
  const contentRepository = new DrizzleContentRepository(db as any);
  const repositoryRepository = new DrizzleRepositoryRepository(db as any);
  const feedRepository = new DrizzleFeedRepository(db as any);
  const pageRepository = new DrizzlePageRepository(db as any);
  const templateRepository = new DrizzleTemplateRepository(db as any);

  // クエリハンドラーの作成
  const getUserByIdQueryHandler = new GetUserByIdQueryHandler(userRepository);
  const getContentByIdQueryHandler = new GetContentByIdQueryHandler(contentRepository);
  const getFeedByIdQueryHandler = new GetFeedByIdQueryHandler(feedRepository);
  const getFeedsByUserIdQueryHandler = new GetFeedsByUserIdQueryHandler(feedRepository);
  const getPageByIdQueryHandler = new GetPageByIdQueryHandler(pageRepository);
  const getPageBySlugQueryHandler = new GetPageBySlugQueryHandler(pageRepository);
  const getPageByContentIdQueryHandler = new GetPageByContentIdQueryHandler(pageRepository);
  const getTemplateByIdQueryHandler = new GetTemplateByIdQueryHandler(templateRepository);
  const getAllTemplatesQueryHandler = new GetAllTemplatesQueryHandler(templateRepository);

  // コマンドハンドラーの作成
  const createUserCommandHandler = new CreateUserCommandHandler(userRepository);
  const createContentCommandHandler = new CreateContentCommandHandler(contentRepository, repositoryRepository);
  const createFeedCommandHandler = new CreateFeedCommandHandler(feedRepository);

  // ルートの設定
  app.route("/api/users", userRoutes(getUserByIdQueryHandler, createUserCommandHandler));
  app.route("/api/contents", contentRoutes(getContentByIdQueryHandler, createContentCommandHandler));
  app.route("/api/feeds", feedRoutes(getFeedByIdQueryHandler, getFeedsByUserIdQueryHandler, createFeedCommandHandler));
  app.route("/api/pages", pageRoutes(getPageByIdQueryHandler, getPageBySlugQueryHandler, getPageByContentIdQueryHandler));
  app.route("/api/templates", templateRoutes(getTemplateByIdQueryHandler, getAllTemplatesQueryHandler));

  return app;
} 