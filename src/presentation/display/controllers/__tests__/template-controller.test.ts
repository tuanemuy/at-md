import { expect } from "@std/expect";
import { describe, it, beforeEach } from "@std/testing/bdd";
import { err, ok } from "npm:neverthrow";
import { EntityNotFoundError } from "../../../../core/errors/application.ts";
import { PresentationError } from "../../../../core/errors/base.ts";
import { ViewTemplate } from "../../../../core/display/entities/view-template.ts";
import { 
  GetTemplateByIdQueryHandler,
  GetAllTemplatesQueryHandler
} from "../../../../application/display/queries/mod.ts";
import { TemplateController } from "../template-controller.ts";
import { TemplateDto } from "../../dtos/template-dto.ts";

// モックハンドラーを作成するヘルパー関数
function createMockQueryHandler<T, U>(returnValue: T) {
  return {
    execute: () => Promise.resolve(ok(returnValue))
  } as unknown as U;
}

// エラーを返すモックハンドラーを作成するヘルパー関数
function createErrorMockQueryHandler<U>(error: Error) {
  return {
    execute: () => Promise.resolve(err(error))
  } as unknown as U;
}

describe("TemplateController", () => {
  let templateController: TemplateController;
  let mockGetTemplateByIdQueryHandler: GetTemplateByIdQueryHandler;
  let mockGetAllTemplatesQueryHandler: GetAllTemplatesQueryHandler;
  let testTemplate: ViewTemplate;
  let testTemplates: ViewTemplate[];

  beforeEach(() => {
    // テスト用のテンプレートを作成
    const now = new Date();
    testTemplate = new ViewTemplate({
      id: "template-1",
      name: "テストテンプレート",
      description: "テスト用のテンプレートです",
      layout: "blog",
      components: [
        {
          id: "header-1",
          type: "header",
          props: { content: "ヘッダーコンテンツ" }
        }
      ],
      createdAt: now,
      updatedAt: now
    });

    testTemplates = [
      testTemplate,
      new ViewTemplate({
        id: "template-2",
        name: "テストテンプレート2",
        layout: "default",
        components: [],
        createdAt: now,
        updatedAt: now
      })
    ];

    // モックハンドラーを作成
    mockGetTemplateByIdQueryHandler = createMockQueryHandler<ViewTemplate, GetTemplateByIdQueryHandler>(testTemplate);
    mockGetAllTemplatesQueryHandler = createMockQueryHandler<ViewTemplate[], GetAllTemplatesQueryHandler>(testTemplates);

    // コントローラーを作成
    templateController = new TemplateController(
      mockGetTemplateByIdQueryHandler,
      mockGetAllTemplatesQueryHandler
    );
  });

  describe("getTemplateById", () => {
    it("有効なIDでテンプレートを取得できること", async () => {
      // テスト実行
      const result = await templateController.getTemplateById("template-1");

      // 結果を検証
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const templateDto = result.value;
        expect(templateDto.id).toBe("template-1");
        expect(templateDto.name).toBe("テストテンプレート");
        expect(templateDto.description).toBe("テスト用のテンプレートです");
        expect(templateDto.layout).toBe("blog");
        expect(templateDto.components.length).toBe(1);
      }
    });

    it("IDが空の場合はエラーを返すこと", async () => {
      // テスト実行
      const result = await templateController.getTemplateById("");

      // 結果を検証
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(PresentationError);
        expect(result.error.message).toContain("Template ID is required");
      }
    });

    it("テンプレートが見つからない場合はEntityNotFoundErrorを返すこと", async () => {
      // エラーを返すモックハンドラーを作成
      const notFoundError = new EntityNotFoundError("Template", "not-found");
      const errorHandler = createErrorMockQueryHandler<GetTemplateByIdQueryHandler>(notFoundError);
      
      // エラーを返すハンドラーでコントローラーを作成
      const errorController = new TemplateController(
        errorHandler,
        mockGetAllTemplatesQueryHandler
      );

      // テスト実行
      const result = await errorController.getTemplateById("not-found");

      // 結果を検証
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(EntityNotFoundError);
      }
    });
  });

  describe("getAllTemplates", () => {
    it("すべてのテンプレートを取得できること", async () => {
      // テスト実行
      const result = await templateController.getAllTemplates();

      // 結果を検証
      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        const templateDtos = result.value;
        expect(templateDtos.length).toBe(2);
        expect(templateDtos[0].id).toBe("template-1");
        expect(templateDtos[1].id).toBe("template-2");
      }
    });

    it("エラーが発生した場合はPresentationErrorを返すこと", async () => {
      // エラーを返すモックハンドラーを作成
      const applicationError = new Error("テスト用エラー");
      const errorHandler = createErrorMockQueryHandler<GetAllTemplatesQueryHandler>(applicationError);
      
      // エラーを返すハンドラーでコントローラーを作成
      const errorController = new TemplateController(
        mockGetTemplateByIdQueryHandler,
        errorHandler
      );

      // テスト実行
      const result = await errorController.getAllTemplates();

      // 結果を検証
      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error).toBeInstanceOf(PresentationError);
        expect(result.error.message).toContain("Failed to get all templates");
      }
    });
  });
}); 