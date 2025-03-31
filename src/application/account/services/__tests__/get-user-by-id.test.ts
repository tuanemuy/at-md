import {
  cleanupTestDatabase,
  closeTestDatabase,
  getTestDatabase,
  setupTestDatabase,
} from "@/application/__test__/setup";
import type { Profile } from "@/domain/account/models";
import {
  ApplicationServiceError,
  ApplicationServiceErrorCode,
} from "@/domain/types/error";
import { RepositoryError, RepositoryErrorCode } from "@/domain/types/error";
import { generateId } from "@/domain/types/id";
import { DrizzleUserRepository } from "@/infrastructure/db/repositories/account/user-repository";
import { errAsync, okAsync } from "@/lib/result";
import { PGlite } from "@electric-sql/pglite";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { GetUserByIdService } from "../get-user-by-id";

// データベース関連の変数
let client: PGlite;
let userRepository: DrizzleUserRepository;

beforeEach(async () => {
  // テスト用のデータベースをセットアップ
  client = new PGlite();
  await setupTestDatabase(client);
  const db = getTestDatabase(client);
  userRepository = new DrizzleUserRepository(db);
});

afterEach(async () => {
  // テスト用のデータベースをクリーンアップ
  await cleanupTestDatabase(client);
  await closeTestDatabase(client);
});

test("ユーザーIDに基づいてユーザーを返すこと", async () => {
  // テスト用のユーザーデータ
  const did = `did:plc:${generateId("DID")}`;
  const profile: Profile = {
    displayName: "Test User",
    description: "Test description",
    avatarUrl: "https://example.com/avatar.jpg",
    bannerUrl: "https://example.com/banner.jpg",
  };

  // ユーザーをテストデータベースに作成
  const createResult = await userRepository.create({
    did,
    profile,
  });
  expect(createResult.isOk()).toBe(true);
  const userId = createResult.isOk() ? createResult.value.id : "";

  // テスト対象のサービスを実行
  const service = new GetUserByIdService({
    deps: {
      userRepository,
    },
  });

  const result = await service.execute({ userId });

  expect(result.isOk()).toBe(true);
  if (result.isOk()) {
    const user = result.value;
    expect(user.id).toBe(userId);
    expect(user.did).toBe(did);
    expect(user.profile.displayName).toBe(profile.displayName);
    expect(user.profile.description).toBe(profile.description);
    expect(user.profile.avatarUrl).toBe(profile.avatarUrl);
    expect(user.profile.bannerUrl).toBe(profile.bannerUrl);
  }
});

test("ユーザーが存在しない場合にエラーを返すこと", async () => {
  const userId = generateId("User");

  const service = new GetUserByIdService({
    deps: {
      userRepository,
    },
  });

  const result = await service.execute({ userId });

  expect(result.isErr()).toBe(true);
  if (result.isErr()) {
    expect(result.error).toBeInstanceOf(ApplicationServiceError);
    expect(result.error.code).toBe(
      ApplicationServiceErrorCode.ACCOUNT_CONTEXT_ERROR,
    );
  }
});
