/**
 * 配信スキーマのテスト
 */

import { expect } from "@std/expect";
import { describe, it } from "@std/testing/bdd";
import { z } from "../../../../../src/deps.ts";
import {
  deliveryIdSchema,
  platformSchema,
  deliveryStatusSchema,
  deliveryErrorSchema,
  deliveryResultSchema,
  deliverySchema,
  createDeliveryParamsSchema,
  updateDeliveryParamsSchema,
  deliveryConfigSchema,
  createDeliveryConfigParamsSchema,
  updateDeliveryConfigParamsSchema
} from "../../../../../src/core/delivery/schemas/mod.ts";
import {
  createTestDelivery,
  createTestCompletedDelivery,
  createTestFailedDelivery,
  createTestDeliveryError,
  createTestDeliveryResult,
  createTestDeliveryParams,
  createTestUpdateDeliveryParams,
  createTestDeliveryConfig,
  createTestDeliveryConfigParams,
  createTestUpdateDeliveryConfigParams,
  createInvalidDeliveryData
} from "../../../../helpers/delivery-test-factory.ts";

describe("配信スキーマ", () => {
  describe("platformSchema", () => {
    it("有効なプラットフォームの場合、バリデーションが成功すること", () => {
      const platform = "twitter";
      const result = platformSchema.safeParse(platform);
      expect(result.success).toBe(true);
    });

    it("無効なプラットフォームの場合、バリデーションが失敗すること", () => {
      const platform = "invalid-platform";
      const result = platformSchema.safeParse(platform);
      expect(result.success).toBe(false);
    });
  });

  describe("deliveryStatusSchema", () => {
    it("有効なステータスの場合、バリデーションが成功すること", () => {
      const status = "pending";
      const result = deliveryStatusSchema.safeParse(status);
      expect(result.success).toBe(true);
    });

    it("無効なステータスの場合、バリデーションが失敗すること", () => {
      const status = "invalid-status";
      const result = deliveryStatusSchema.safeParse(status);
      expect(result.success).toBe(false);
    });
  });

  describe("deliveryErrorSchema", () => {
    it("有効なエラーデータの場合、バリデーションが成功すること", () => {
      const error = createTestDeliveryError();
      const result = deliveryErrorSchema.safeParse(error);
      expect(result.success).toBe(true);
    });

    it("必須フィールドが欠けている場合、バリデーションが失敗すること", () => {
      const error = {
        code: "error-123"
        // messageが欠けている
      };
      const result = deliveryErrorSchema.safeParse(error);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("message");
      }
    });
  });

  describe("deliveryResultSchema", () => {
    it("有効な結果データの場合、バリデーションが成功すること", () => {
      const result = createTestDeliveryResult();
      const validationResult = deliveryResultSchema.safeParse(result);
      expect(validationResult.success).toBe(true);
    });

    it("URLが無効な場合、バリデーションが失敗すること", () => {
      const result = {
        url: "invalid-url",
        externalId: "external-456"
      };
      const validationResult = deliveryResultSchema.safeParse(result);
      expect(validationResult.success).toBe(false);
      if (!validationResult.success) {
        expect(validationResult.error.issues[0].path).toContain("url");
      }
    });
  });

  describe("deliverySchema", () => {
    it("有効な配信データの場合、バリデーションが成功すること", () => {
      const delivery = createTestDelivery();
      const result = deliverySchema.safeParse(delivery);
      expect(result.success).toBe(true);
    });

    it("完了した配信データの場合、バリデーションが成功すること", () => {
      const delivery = createTestCompletedDelivery();
      const result = deliverySchema.safeParse(delivery);
      expect(result.success).toBe(true);
    });

    it("失敗した配信データの場合、バリデーションが成功すること", () => {
      const delivery = createTestFailedDelivery();
      const result = deliverySchema.safeParse(delivery);
      expect(result.success).toBe(true);
    });

    it("無効な配信データの場合、バリデーションが失敗すること", () => {
      const invalidDelivery = createInvalidDeliveryData();
      const result = deliverySchema.safeParse(invalidDelivery);
      expect(result.success).toBe(false);
    });
  });

  describe("createDeliveryParamsSchema", () => {
    it("有効な配信作成パラメータの場合、バリデーションが成功すること", () => {
      const params = createTestDeliveryParams();
      const result = createDeliveryParamsSchema.safeParse(params);
      expect(result.success).toBe(true);
    });

    it("無効なプラットフォームを含む場合、バリデーションが失敗すること", () => {
      const params = {
        ...createTestDeliveryParams(),
        platform: "invalid-platform"
      };
      const result = createDeliveryParamsSchema.safeParse(params);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("platform");
      }
    });
  });

  describe("updateDeliveryParamsSchema", () => {
    it("有効な配信更新パラメータの場合、バリデーションが成功すること", () => {
      const params = createTestUpdateDeliveryParams();
      const result = updateDeliveryParamsSchema.safeParse(params);
      expect(result.success).toBe(true);
    });

    it("部分的な更新パラメータの場合、バリデーションが成功すること", () => {
      const params = {
        status: "completed",
        completedAt: new Date()
      };
      const result = updateDeliveryParamsSchema.safeParse(params);
      expect(result.success).toBe(true);
    });

    it("無効なステータスを含む場合、バリデーションが失敗すること", () => {
      const params = {
        status: "invalid-status"
      };
      const result = updateDeliveryParamsSchema.safeParse(params);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("status");
      }
    });
  });

  describe("deliveryConfigSchema", () => {
    it("有効な配信設定の場合、バリデーションが成功すること", () => {
      const config = createTestDeliveryConfig();
      const result = deliveryConfigSchema.safeParse(config);
      expect(result.success).toBe(true);
    });

    it("必須フィールドが欠けている場合、バリデーションが失敗すること", () => {
      const config = {
        userId: "user-456",
        platform: "twitter",
        // enabledが欠けている
        createdAt: new Date(),
        updatedAt: new Date()
      };
      const result = deliveryConfigSchema.safeParse(config);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("enabled");
      }
    });
  });

  describe("createDeliveryConfigParamsSchema", () => {
    it("有効な配信設定作成パラメータの場合、バリデーションが成功すること", () => {
      const params = createTestDeliveryConfigParams();
      const result = createDeliveryConfigParamsSchema.safeParse(params);
      expect(result.success).toBe(true);
    });

    it("enabledが省略された場合、デフォルト値が設定されること", () => {
      const params = {
        userId: "user-456",
        platform: "twitter"
      };
      const result = createDeliveryConfigParamsSchema.safeParse(params);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.enabled).toBe(true);
      }
    });
  });

  describe("updateDeliveryConfigParamsSchema", () => {
    it("有効な配信設定更新パラメータの場合、バリデーションが成功すること", () => {
      const params = createTestUpdateDeliveryConfigParams();
      const result = updateDeliveryConfigParamsSchema.safeParse(params);
      expect(result.success).toBe(true);
    });

    it("部分的な更新パラメータの場合、バリデーションが成功すること", () => {
      const params = {
        enabled: false
      };
      const result = updateDeliveryConfigParamsSchema.safeParse(params);
      expect(result.success).toBe(true);
    });
  });
}); 