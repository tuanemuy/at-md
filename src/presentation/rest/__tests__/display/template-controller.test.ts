import { assertEquals, assertInstanceOf } from "https://deno.land/std/assert/mod.ts";
import { spy } from "https://deno.land/std/testing/mock.ts";
import { ok, err, Result } from "neverthrow";

// コンテキスト型の定義
interface RequestContext {
  req: {
    param: (name: string) => string;
  };
}

// テンプレート型の定義
interface Template {
  id: string;
  userId: string;
  name: string;
  description: string;
  content: string;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// エラー型の定義
class TemplateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TemplateError";
  }
}

interface TemplateController {
  getTemplateById(c: RequestContext): Promise<Response>;
  getAllTemplates(c: RequestContext): Promise<Response>;
}

interface GetTemplateByIdQueryHandler {
  execute(query: { name: string; id: string }): Promise<Result<Template, TemplateError>>;
}

interface GetAllTemplatesQueryHandler {
  execute(query: { name: string }): Promise<Result<Template[], TemplateError>>;
}

interface TemplateRepository {
  findById(id: string): Promise<Template | null>;
  findAll(): Promise<Template[]>;
  save(templateAggregate: Template): Promise<Template>;
  delete(id: string): Promise<boolean>;
}

class MockTemplateRepository implements TemplateRepository {
  private templates: Map<string, Template> = new Map();

  constructor() {
    // テスト用のデータを初期化
    const template1 = this.createMockTemplate({
      id: "template-1",
      userId: "user-1",
      name: "ブログ記事テンプレート",
      description: "ブログ記事用の標準テンプレート",
      content: "# {{title}}\n\n{{content}}\n\n## 関連記事\n\n{{relatedPosts}}",
      isPublic: true,
    });

    const template2 = this.createMockTemplate({
      id: "template-2",
      userId: "user-1",
      name: "ドキュメントテンプレート",
      description: "技術ドキュメント用のテンプレート",
      content: "# {{title}}\n\n## 概要\n\n{{description}}\n\n## 詳細\n\n{{content}}",
      isPublic: false,
    });

    this.templates.set("template-1", template1);
    this.templates.set("template-2", template2);
  }

  private createMockTemplate(params: {
    id: string;
    userId: string;
    name: string;
    description: string;
    content: string;
    isPublic: boolean;
  }): Template {
    return {
      id: params.id,
      userId: params.userId,
      name: params.name,
      description: params.description,
      content: params.content,
      isPublic: params.isPublic,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  findById(id: string): Promise<Template | null> {
    return Promise.resolve(this.templates.get(id) || null);
  }

  findAll(): Promise<Template[]> {
    return Promise.resolve(Array.from(this.templates.values()));
  }

  save(template: Template): Promise<Template> {
    this.templates.set(template.id, template);
    return Promise.resolve(template);
  }

  delete(id: string): Promise<boolean> {
    return Promise.resolve(this.templates.delete(id));
  }
}

Deno.test("TemplateController", async (t) => {
  await t.step("getTemplateById", async (t) => {
    await t.step("存在するIDの場合、テンプレートを返すこと", async () => {
      // モックの準備
      const templateRepository = new MockTemplateRepository();
      const getTemplateByIdQueryHandler: GetTemplateByIdQueryHandler = {
        execute: spy(async (query: { name: string; id: string }) => {
          const template = await templateRepository.findById(query.id);
          if (!template) {
            return err(new TemplateError("Template not found"));
          }
          return ok(template);
        }),
      };

      // コントローラーの実装
      const templateController: TemplateController = {
        async getTemplateById(c) {
          const id = c.req.param("id");
          const result = await getTemplateByIdQueryHandler.execute({
            name: "GetTemplateById",
            id,
          });

          if (result.isErr()) {
            const error = result.error;
            return new Response(JSON.stringify({ error: error.message }), {
              status: 404,
              headers: { "Content-Type": "application/json" },
            });
          }

          return new Response(JSON.stringify(result.value), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        },
        getAllTemplates() {
          return Promise.resolve(new Response());
        },
      };

      // テスト実行
      const context: RequestContext = {
        req: {
          param: () => "template-1",
        },
      };

      const response = await templateController.getTemplateById(context);
      assertEquals(response.status, 200);

      const body = await response.json();
      assertEquals(body.id, "template-1");
      assertEquals(body.name, "ブログ記事テンプレート");
    });

    await t.step("存在しないIDの場合、404エラーを返すこと", async () => {
      // モックの準備
      const templateRepository = new MockTemplateRepository();
      const getTemplateByIdQueryHandler: GetTemplateByIdQueryHandler = {
        execute: spy(async (query: { name: string; id: string }) => {
          const template = await templateRepository.findById(query.id);
          if (!template) {
            return err(new TemplateError("Template not found"));
          }
          return ok(template);
        }),
      };

      // コントローラーの実装
      const templateController: TemplateController = {
        async getTemplateById(c) {
          const id = c.req.param("id");
          const result = await getTemplateByIdQueryHandler.execute({
            name: "GetTemplateById",
            id,
          });

          if (result.isErr()) {
            const error = result.error;
            return new Response(JSON.stringify({ error: error.message }), {
              status: 404,
              headers: { "Content-Type": "application/json" },
            });
          }

          return new Response(JSON.stringify(result.value), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        },
        getAllTemplates() {
          return Promise.resolve(new Response());
        },
      };

      // テスト実行
      const context: RequestContext = {
        req: {
          param: () => "non-existent-id",
        },
      };

      const response = await templateController.getTemplateById(context);
      assertEquals(response.status, 404);

      const body = await response.json();
      assertEquals(body.error, "Template not found");
    });
  });

  await t.step("getAllTemplates", async (t) => {
    await t.step("すべてのテンプレートを返すこと", async () => {
      // モックの準備
      const templateRepository = new MockTemplateRepository();
      const getAllTemplatesQueryHandler: GetAllTemplatesQueryHandler = {
        execute: spy(async (query: { name: string }) => {
          const templates = await templateRepository.findAll();
          return ok(templates);
        }),
      };

      // コントローラーの実装
      const templateController: TemplateController = {
        getTemplateById() {
          return Promise.resolve(new Response());
        },
        async getAllTemplates(c) {
          const result = await getAllTemplatesQueryHandler.execute({
            name: "GetAllTemplates",
          });

          if (result.isErr()) {
            const error = result.error;
            return new Response(JSON.stringify({ error: error.message }), {
              status: 500,
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
      const context: RequestContext = {
        req: {
          param: () => "",
        },
      };

      const response = await templateController.getAllTemplates(context);
      assertEquals(response.status, 200);

      const body = await response.json();
      assertEquals(body.length, 2);
      assertEquals(body[0].id, "template-1");
      assertEquals(body[1].id, "template-2");
    });
  });
}); 