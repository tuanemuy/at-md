import {
  cleanupTestDatabase,
  closeTestDatabase,
  getTestDatabase,
  setupTestDatabase,
} from "@/application/__test__/setup";
import type { Profile } from "@/domain/account/models";
import type { User } from "@/domain/account/models/user";
import type { CreateUser } from "@/domain/account/repositories";
import {
  ApplicationServiceError,
  ApplicationServiceErrorCode,
} from "@/domain/types/error";
import { RepositoryError, RepositoryErrorCode } from "@/domain/types/error";
import { generateId } from "@/domain/types/id";
import { DrizzleUserRepository } from "@/infrastructure/db/repositories/account/user-repository";
import { okAsync } from "@/lib/result";
import { PGlite } from "@electric-sql/pglite";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { UpdateProfileService } from "../update-profile";

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

test("プロフィール更新が成功した場合に更新後のユーザー情報が返されること", async () => {
  // テスト用ユーザーを作成
  const did = "test-did";
  const initialProfile: Profile = {
    displayName: "Test User",
    description: null,
    avatarUrl: null,
    bannerUrl: null,
  };

  // 初期ユーザーを作成
  const testUser: CreateUser = {
    did,
    profile: initialProfile,
  };

  const createResult = await userRepository.create(testUser);
  expect(createResult.isOk()).toBe(true);
  const createdUserId = createResult.isOk() ? createResult.value.id : "";

  // プロフィール更新内容
  const updatedProfile: Profile = {
    displayName: "Updated User",
    description: "Updated description",
    avatarUrl: "https://example.com/avatar-updated.jpg",
    bannerUrl: "https://example.com/banner-updated.jpg",
  };

  const service = new UpdateProfileService({
    deps: {
      userRepository,
    },
  });

  // テスト実行
  const result = await service.execute({
    userId: createdUserId,
    did,
    profile: updatedProfile,
  });

  // 検証
  expect(result.isOk()).toBe(true);
  if (result.isOk()) {
    expect(result.value.id).toEqual(createdUserId);
    expect(result.value.did).toEqual(did);
    expect(result.value.profile.displayName).toEqual("Updated User");
    expect(result.value.profile.description).toEqual("Updated description");
    expect(result.value.profile.avatarUrl).toEqual(
      "https://example.com/avatar-updated.jpg",
    );
    expect(result.value.profile.bannerUrl).toEqual(
      "https://example.com/banner-updated.jpg",
    );
  }
});

test("存在しないユーザーIDの場合にエラーが返されること", async () => {
  const nonExistingUserId = generateId("User");
  const did = "test-did";
  const updatedProfile: Profile = {
    displayName: "Updated User",
    description: "Updated description",
    avatarUrl: "https://example.com/avatar-updated.jpg",
    bannerUrl: "https://example.com/banner-updated.jpg",
  };

  const service = new UpdateProfileService({
    deps: {
      userRepository,
    },
  });

  const result = await service.execute({
    userId: nonExistingUserId,
    did,
    profile: updatedProfile,
  });

  expect(result.isErr()).toBe(true);
  if (result.isErr()) {
    expect(result.error).toBeInstanceOf(ApplicationServiceError);
    expect(result.error.code).toBe(
      ApplicationServiceErrorCode.ACCOUNT_CONTEXT_ERROR,
    );
    const repositoryError = result.error.cause as RepositoryError;
    expect(repositoryError).toBeInstanceOf(RepositoryError);
  }
});
