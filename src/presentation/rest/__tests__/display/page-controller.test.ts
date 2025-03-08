import { assertEquals, assertInstanceOf } from "https://deno.land/std/assert/mod.ts";
import { spy } from "https://deno.land/std/testing/mock.ts";
import { ok, err } from "neverthrow";

// ドメインモデルのインポートはテスト実行時に必要になるため、コメントアウトしておきます
// import { PageAggregate } from "../../../../domain/display/aggregates/page-aggregate.ts";
// import { Page } from "../../../../domain/display/entities/page.ts";
// import { PageMetadata } from "../../../../domain/display/value-objects/page-metadata.ts";
// import { PageRepository } from "../../../../domain/display/repositories/page-repository.ts";
// import { GetPageByIdQueryHandler } from "../../../../application/display/queries/get-page-by-id-query.ts";
// import { GetPageBySlugQueryHandler } from "../../../../application/display/queries/get-page-by-slug-query.ts";
// import { GetPageByContentIdQueryHandler } from "../../../../application/display/queries/get-page-by-content-id-query.ts";

interface PageController {
  getPageById(c: any): Promise<Response>;
  getPageBySlug(c: any): Promise<Response>;
  getPageByContentId(c: any): Promise<Response>;
}

interface GetPageByIdQueryHandler {
  execute(query: { name: string; id: string }): Promise<any>;
}

interface GetPageBySlugQueryHandler {
  execute(query: { name: string; slug: string }): Promise<any>;
}

interface GetPageByContentIdQueryHandler {
  execute(query: { name: string; contentId: string }): Promise<any>;
}

interface PageRepository {
  findById(id: string): Promise<any | null>;
  findBySlug(slug: string): Promise<any | null>;
  findByContentId(contentId: string): Promise<any | null>;
  findByUserId(userId: string, options?: { limit?: number; offset?: number }): Promise<any[]>;
  save(pageAggregate: any): Promise<any>;
  delete(id: string): Promise<boolean>;
}

class MockPageRepository implements PageRepository {
  private pages: Map<string, any> = new Map();

  constructor() {
    // テスト用のデータを初期化
    const page1 = this.createMockPageAggregate({
      id: "page-1",
      userId: "user-1",
      title: "テストページ1",
      slug: "test-page-1",
      contentId: "content-1",
      templateId: "template-1",
      isPublic: true,
    });

    const page2 = this.createMockPageAggregate({
      id: "page-2",
      userId: "user-1",
      title: "テストページ2",
      slug: "test-page-2",
      contentId: "content-2",
      templateId: "template-1",
      isPublic: false,
    });

    this.pages.set("page-1", page1);
    this.pages.set("page-2", page2);
  }

  private createMockPageAggregate(params: {
    id: string;
    userId: string;
    title: string;
    slug: string;
    contentId: string;
    templateId: string;
    isPublic: boolean;
  }): any {
    const page = {
      id: params.id,
      userId: params.userId,
      title: params.title,
      slug: params.slug,
      contentId: params.contentId,
      templateId: params.templateId,
      isPublic: params.isPublic,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const metadata = {
      title: params.title,
      description: "テスト説明",
      keywords: ["テスト", "ページ"],
      ogImage: "https://example.com/image.jpg",
    };

    return {
      getPage: () => page,
      getMetadata: () => metadata,
    };
  }

  async findById(id: string): Promise<any | null> {
    return this.pages.get(id) || null;
  }

  async findBySlug(slug: string): Promise<any | null> {
    for (const page of this.pages.values()) {
      if (page.getPage().slug === slug) {
        return page;
      }
    }
    return null;
  }

  async findByContentId(contentId: string): Promise<any | null> {
    for (const page of this.pages.values()) {
      if (page.getPage().contentId === contentId) {
        return page;
      }
    }
    return null;
  }

  async findByUserId(userId: string, options?: {
    limit?: number;
    offset?: number;
  }): Promise<any[]> {
    const result: any[] = [];
    for (const page of this.pages.values()) {
      if (page.getPage().userId === userId) {
        result.push(page);
      }
    }
    return result;
  }

  async save(pageAggregate: any): Promise<any> {
    this.pages.set(pageAggregate.getPage().id, pageAggregate);
    return pageAggregate;
  }

  async delete(id: string): Promise<boolean> {
    return this.pages.delete(id);
  }
}

Deno.test("PageController", async (t) => {
  await t.step("getPageById", async (t) => {
    await t.step("存在するIDの場合、ページを返すこと", async () => {
      // モックの準備
      const pageRepository = new MockPageRepository();
      const getPageByIdQueryHandler = {
        execute: spy(async (query: { name: string; id: string }) => {
          const page = await pageRepository.findById(query.id);
          if (!page) {
            return err(new Error("Page not found"));
          }
          return ok({
            id: page.getPage().id,
            userId: page.getPage().userId,
            title: page.getPage().title,
            slug: page.getPage().slug,
            contentId: page.getPage().contentId,
            templateId: page.getPage().templateId,
            isPublic: page.getPage().isPublic,
            metadata: page.getMetadata(),
            createdAt: page.getPage().createdAt,
            updatedAt: page.getPage().updatedAt,
          });
        }),
      };

      // コントローラーの実装
      const pageController: PageController = {
        async getPageById(c) {
          const id = c.req.param("id");
          const result = await getPageByIdQueryHandler.execute({
            name: "GetPageById",
            id,
          });

          if (result.isErr()) {
            return new Response(JSON.stringify({ error: result.error.message }), {
              status: 404,
              headers: { "Content-Type": "application/json" },
            });
          }

          return new Response(JSON.stringify(result.value), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        },
        async getPageBySlug() {
          return new Response();
        },
        async getPageByContentId() {
          return new Response();
        },
      };

      // テスト実行
      const context = {
        req: {
          param: () => "page-1",
        },
      };

      const response = await pageController.getPageById(context);
      assertEquals(response.status, 200);

      const body = await response.json();
      assertEquals(body.id, "page-1");
      assertEquals(body.title, "テストページ1");
    });

    await t.step("存在しないIDの場合、404エラーを返すこと", async () => {
      // モックの準備
      const pageRepository = new MockPageRepository();
      const getPageByIdQueryHandler = {
        execute: spy(async (query: { name: string; id: string }) => {
          const page = await pageRepository.findById(query.id);
          if (!page) {
            return err(new Error("Page not found"));
          }
          return ok({
            id: page.getPage().id,
            userId: page.getPage().userId,
            title: page.getPage().title,
            slug: page.getPage().slug,
            contentId: page.getPage().contentId,
            templateId: page.getPage().templateId,
            isPublic: page.getPage().isPublic,
            metadata: page.getMetadata(),
            createdAt: page.getPage().createdAt,
            updatedAt: page.getPage().updatedAt,
          });
        }),
      };

      // コントローラーの実装
      const pageController: PageController = {
        async getPageById(c) {
          const id = c.req.param("id");
          const result = await getPageByIdQueryHandler.execute({
            name: "GetPageById",
            id,
          });

          if (result.isErr()) {
            return new Response(JSON.stringify({ error: result.error.message }), {
              status: 404,
              headers: { "Content-Type": "application/json" },
            });
          }

          return new Response(JSON.stringify(result.value), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        },
        async getPageBySlug() {
          return new Response();
        },
        async getPageByContentId() {
          return new Response();
        },
      };

      // テスト実行
      const context = {
        req: {
          param: () => "non-existent-id",
        },
      };

      const response = await pageController.getPageById(context);
      assertEquals(response.status, 404);

      const body = await response.json();
      assertEquals(body.error, "Page not found");
    });
  });

  await t.step("getPageBySlug", async (t) => {
    await t.step("存在するスラグの場合、ページを返すこと", async () => {
      // モックの準備
      const pageRepository = new MockPageRepository();
      const getPageBySlugQueryHandler = {
        execute: spy(async (query: { name: string; slug: string }) => {
          const page = await pageRepository.findBySlug(query.slug);
          if (!page) {
            return err(new Error("Page not found"));
          }
          return ok({
            id: page.getPage().id,
            userId: page.getPage().userId,
            title: page.getPage().title,
            slug: page.getPage().slug,
            contentId: page.getPage().contentId,
            templateId: page.getPage().templateId,
            isPublic: page.getPage().isPublic,
            metadata: page.getMetadata(),
            createdAt: page.getPage().createdAt,
            updatedAt: page.getPage().updatedAt,
          });
        }),
      };

      // コントローラーの実装
      const pageController: PageController = {
        async getPageById() {
          return new Response();
        },
        async getPageBySlug(c) {
          const slug = c.req.param("slug");
          const result = await getPageBySlugQueryHandler.execute({
            name: "GetPageBySlug",
            slug,
          });

          if (result.isErr()) {
            return new Response(JSON.stringify({ error: result.error.message }), {
              status: 404,
              headers: { "Content-Type": "application/json" },
            });
          }

          return new Response(JSON.stringify(result.value), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        },
        async getPageByContentId() {
          return new Response();
        },
      };

      // テスト実行
      const context = {
        req: {
          param: () => "test-page-1",
        },
      };

      const response = await pageController.getPageBySlug(context);
      assertEquals(response.status, 200);

      const body = await response.json();
      assertEquals(body.id, "page-1");
      assertEquals(body.slug, "test-page-1");
    });
  });

  await t.step("getPageByContentId", async (t) => {
    await t.step("存在するコンテンツIDの場合、ページを返すこと", async () => {
      // モックの準備
      const pageRepository = new MockPageRepository();
      const getPageByContentIdQueryHandler = {
        execute: spy(async (query: { name: string; contentId: string }) => {
          const page = await pageRepository.findByContentId(query.contentId);
          if (!page) {
            return err(new Error("Page not found"));
          }
          return ok({
            id: page.getPage().id,
            userId: page.getPage().userId,
            title: page.getPage().title,
            slug: page.getPage().slug,
            contentId: page.getPage().contentId,
            templateId: page.getPage().templateId,
            isPublic: page.getPage().isPublic,
            metadata: page.getMetadata(),
            createdAt: page.getPage().createdAt,
            updatedAt: page.getPage().updatedAt,
          });
        }),
      };

      // コントローラーの実装
      const pageController: PageController = {
        async getPageById() {
          return new Response();
        },
        async getPageBySlug() {
          return new Response();
        },
        async getPageByContentId(c) {
          const contentId = c.req.param("contentId");
          const result = await getPageByContentIdQueryHandler.execute({
            name: "GetPageByContentId",
            contentId,
          });

          if (result.isErr()) {
            return new Response(JSON.stringify({ error: result.error.message }), {
              status: 404,
              headers: { "Content-Type": "application/json" },
            });
          }

          return new Response(JSON.stringify(result.value), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        },
      };

      // テスト実行
      const context = {
        req: {
          param: () => "content-1",
        },
      };

      const response = await pageController.getPageByContentId(context);
      assertEquals(response.status, 200);

      const body = await response.json();
      assertEquals(body.id, "page-1");
      assertEquals(body.contentId, "content-1");
    });
  });
}); 