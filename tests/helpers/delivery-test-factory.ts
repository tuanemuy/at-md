/**
 * 配信関連のテストデータファクトリ
 * 
 * 配信ドメインのテスト用データを生成するためのファクトリ関数を提供します。
 */

import { z } from "../../src/deps.ts";
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
  updateDeliveryConfigParamsSchema,
  type DeliverySchema,
  type DeliveryError,
  type DeliveryResult,
  type CreateDeliveryParamsSchema,
  type UpdateDeliveryParamsSchema,
  type DeliveryConfigSchema,
  type CreateDeliveryConfigParamsSchema,
  type UpdateDeliveryConfigParamsSchema
} from "../../src/core/delivery/schemas/mod.ts";
import { Result, ok, err } from "../../src/deps.ts";

/**
 * テスト用の配信エラーを作成する
 * @param overrides 上書きするプロパティ
 * @returns 配信エラー
 */
export function createTestDeliveryError(overrides: Partial<DeliveryError> = {}): DeliveryError {
  return deliveryErrorSchema.parse({
    code: "error-123",
    message: "配信処理中にエラーが発生しました",
    details: {
      statusCode: 500,
      errorType: "api_error"
    },
    ...overrides
  });
}

/**
 * テスト用の配信結果を作成する
 * @param overrides 上書きするプロパティ
 * @returns 配信結果
 */
export function createTestDeliveryResult(overrides: Partial<DeliveryResult> = {}): DeliveryResult {
  return deliveryResultSchema.parse({
    url: "https://example.com/post/123",
    externalId: "external-456",
    metadata: {
      likes: 0,
      comments: 0,
      shares: 0
    },
    ...overrides
  });
}

/**
 * テスト用の配信を作成する
 * @param overrides 上書きするプロパティ
 * @returns 配信
 */
export function createTestDelivery(overrides: Partial<DeliverySchema> = {}): DeliverySchema {
  return deliverySchema.parse({
    id: "delivery-123",
    userId: "user-456",
    contentId: "content-789",
    platform: "twitter",
    status: "pending",
    scheduledAt: new Date("2023-01-01T12:00:00Z"),
    createdAt: new Date("2023-01-01T00:00:00Z"),
    updatedAt: new Date("2023-01-01T00:00:00Z"),
    ...overrides
  });
}

/**
 * テスト用の完了した配信を作成する
 * @param overrides 上書きするプロパティ
 * @returns 完了した配信
 */
export function createTestCompletedDelivery(overrides: Partial<DeliverySchema> = {}): DeliverySchema {
  return deliverySchema.parse({
    id: "delivery-123",
    userId: "user-456",
    contentId: "content-789",
    platform: "twitter",
    status: "completed",
    scheduledAt: new Date("2023-01-01T12:00:00Z"),
    startedAt: new Date("2023-01-01T12:00:00Z"),
    completedAt: new Date("2023-01-01T12:01:00Z"),
    result: createTestDeliveryResult(),
    createdAt: new Date("2023-01-01T00:00:00Z"),
    updatedAt: new Date("2023-01-01T12:01:00Z"),
    ...overrides
  });
}

/**
 * テスト用の失敗した配信を作成する
 * @param overrides 上書きするプロパティ
 * @returns 失敗した配信
 */
export function createTestFailedDelivery(overrides: Partial<DeliverySchema> = {}): DeliverySchema {
  return deliverySchema.parse({
    id: "delivery-123",
    userId: "user-456",
    contentId: "content-789",
    platform: "twitter",
    status: "failed",
    scheduledAt: new Date("2023-01-01T12:00:00Z"),
    startedAt: new Date("2023-01-01T12:00:00Z"),
    error: createTestDeliveryError(),
    createdAt: new Date("2023-01-01T00:00:00Z"),
    updatedAt: new Date("2023-01-01T12:01:00Z"),
    ...overrides
  });
}

/**
 * テスト用の配信作成パラメータを作成する
 * @param overrides 上書きするプロパティ
 * @returns 配信作成パラメータ
 */
export function createTestDeliveryParams(overrides: Partial<CreateDeliveryParamsSchema> = {}): CreateDeliveryParamsSchema {
  return createDeliveryParamsSchema.parse({
    userId: "user-456",
    contentId: "content-789",
    platform: "twitter",
    scheduledAt: new Date("2023-01-01T12:00:00Z"),
    ...overrides
  });
}

/**
 * テスト用の配信更新パラメータを作成する
 * @param overrides 上書きするプロパティ
 * @returns 配信更新パラメータ
 */
export function createTestUpdateDeliveryParams(overrides: Partial<UpdateDeliveryParamsSchema> = {}): UpdateDeliveryParamsSchema {
  return updateDeliveryParamsSchema.parse({
    status: "processing",
    startedAt: new Date(),
    ...overrides
  });
}

/**
 * テスト用の配信設定を作成する
 * @param overrides 上書きするプロパティ
 * @returns 配信設定
 */
export function createTestDeliveryConfig(overrides: Partial<DeliveryConfigSchema> = {}): DeliveryConfigSchema {
  return deliveryConfigSchema.parse({
    userId: "user-456",
    platform: "twitter",
    enabled: true,
    credentials: {
      apiKey: "test-api-key",
      apiSecret: "test-api-secret",
      accessToken: "test-access-token",
      accessTokenSecret: "test-access-token-secret"
    },
    settings: {
      includeHashtags: true,
      includeLink: true
    },
    createdAt: new Date("2023-01-01T00:00:00Z"),
    updatedAt: new Date("2023-01-01T00:00:00Z"),
    ...overrides
  });
}

/**
 * テスト用の配信設定作成パラメータを作成する
 * @param overrides 上書きするプロパティ
 * @returns 配信設定作成パラメータ
 */
export function createTestDeliveryConfigParams(overrides: Partial<CreateDeliveryConfigParamsSchema> = {}): CreateDeliveryConfigParamsSchema {
  return createDeliveryConfigParamsSchema.parse({
    userId: "user-456",
    platform: "twitter",
    enabled: true,
    credentials: {
      apiKey: "test-api-key",
      apiSecret: "test-api-secret",
      accessToken: "test-access-token",
      accessTokenSecret: "test-access-token-secret"
    },
    settings: {
      includeHashtags: true,
      includeLink: true
    },
    ...overrides
  });
}

/**
 * テスト用の配信設定更新パラメータを作成する
 * @param overrides 上書きするプロパティ
 * @returns 配信設定更新パラメータ
 */
export function createTestUpdateDeliveryConfigParams(overrides: Partial<UpdateDeliveryConfigParamsSchema> = {}): UpdateDeliveryConfigParamsSchema {
  return updateDeliveryConfigParamsSchema.parse({
    enabled: false,
    credentials: {
      apiKey: "new-api-key",
      apiSecret: "new-api-secret",
      accessToken: "new-access-token",
      accessTokenSecret: "new-access-token-secret"
    },
    ...overrides
  });
}

/**
 * 無効な配信データを作成する（バリデーションエラーのテスト用）
 * @returns 無効な配信データ
 */
export function createInvalidDeliveryData(): Record<string, unknown> {
  return {
    id: "delivery-123",
    userId: "user-456",
    contentId: "content-789",
    platform: "invalid-platform", // 無効なプラットフォーム
    status: "invalid-status", // 無効なステータス
    scheduledAt: "invalid-date", // 無効な日付
    createdAt: new Date("2023-01-01T00:00:00Z"),
    updatedAt: new Date("2023-01-01T00:00:00Z")
  };
} 