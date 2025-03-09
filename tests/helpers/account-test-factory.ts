/**
 * アカウント関連のテストデータファクトリ
 * 
 * アカウントドメインのテスト用データを生成するためのファクトリ関数を提供します。
 */

import { z } from "../../src/deps.ts";
import {
  userSchema,
  emailSchema,
  passwordSchema,
  usernameSchema,
  displayNameSchema,
  profileSchema,
  accountStatusSchema,
  createUserParamsSchema,
  updateUserParamsSchema,
  credentialsSchema,
  tokenSchema,
  authResultSchema,
  passwordResetTokenSchema,
  changePasswordParamsSchema,
  resetPasswordParamsSchema,
  type UserSchema,
  type ProfileSchema,
  type CreateUserParamsSchema,
  type UpdateUserParamsSchema,
  type CredentialsSchema,
  type AuthResultSchema,
  type PasswordResetTokenSchema,
  type ChangePasswordParamsSchema,
  type ResetPasswordParamsSchema
} from "../../src/core/account/schemas/mod.ts";
import { Result, ok, err } from "../../src/deps.ts";

/**
 * テスト用のユーザープロフィールを作成する
 * @param overrides 上書きするプロパティ
 * @returns ユーザープロフィール
 */
export function createTestProfile(overrides: Partial<ProfileSchema> = {}): ProfileSchema {
  return profileSchema.parse({
    bio: "テストユーザーのプロフィールです。",
    avatarUrl: "https://example.com/avatar.jpg",
    websiteUrl: "https://example.com",
    location: "東京",
    ...overrides
  });
}

/**
 * テスト用のユーザーを作成する
 * @param overrides 上書きするプロパティ
 * @returns ユーザー
 */
export function createTestUser(overrides: Partial<UserSchema> = {}): UserSchema {
  return userSchema.parse({
    id: "user-123",
    username: "testuser",
    email: "test@example.com",
    displayName: "テストユーザー",
    profile: createTestProfile(),
    status: "active",
    createdAt: new Date("2023-01-01T00:00:00Z"),
    updatedAt: new Date("2023-01-02T00:00:00Z"),
    lastLoginAt: new Date("2023-01-03T00:00:00Z"),
    ...overrides
  });
}

/**
 * テスト用のユーザー作成パラメータを作成する
 * @param overrides 上書きするプロパティ
 * @returns ユーザー作成パラメータ
 */
export function createTestUserParams(overrides: Partial<CreateUserParamsSchema> = {}): CreateUserParamsSchema {
  return createUserParamsSchema.parse({
    username: "newuser",
    email: "new@example.com",
    password: "Password123",
    displayName: "新規ユーザー",
    profile: createTestProfile(),
    ...overrides
  });
}

/**
 * テスト用のユーザー更新パラメータを作成する
 * @param overrides 上書きするプロパティ
 * @returns ユーザー更新パラメータ
 */
export function createTestUpdateUserParams(overrides: Partial<UpdateUserParamsSchema> = {}): UpdateUserParamsSchema {
  return updateUserParamsSchema.parse({
    displayName: "更新されたユーザー名",
    profile: {
      bio: "更新されたプロフィール",
      avatarUrl: "https://example.com/new-avatar.jpg",
      websiteUrl: "https://example.com/new",
      location: "大阪"
    },
    ...overrides
  });
}

/**
 * テスト用の認証情報を作成する
 * @param overrides 上書きするプロパティ
 * @returns 認証情報
 */
export function createTestCredentials(overrides: Partial<CredentialsSchema> = {}): CredentialsSchema {
  return credentialsSchema.parse({
    email: "test@example.com",
    password: "Password123",
    ...overrides
  });
}

/**
 * テスト用の認証結果を作成する
 * @param overrides 上書きするプロパティ
 * @returns 認証結果
 */
export function createTestAuthResult(overrides: Partial<AuthResultSchema> = {}): AuthResultSchema {
  return authResultSchema.parse({
    user: createTestUser(),
    token: "test-auth-token-123",
    ...overrides
  });
}

/**
 * テスト用のパスワードリセットトークンを作成する
 * @param overrides 上書きするプロパティ
 * @returns パスワードリセットトークン
 */
export function createTestPasswordResetToken(overrides: Partial<PasswordResetTokenSchema> = {}): PasswordResetTokenSchema {
  return passwordResetTokenSchema.parse({
    userId: "user-123",
    token: "reset-token-456",
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24時間後
    ...overrides
  });
}

/**
 * テスト用のパスワード変更パラメータを作成する
 * @param overrides 上書きするプロパティ
 * @returns パスワード変更パラメータ
 */
export function createTestChangePasswordParams(overrides: Partial<ChangePasswordParamsSchema> = {}): ChangePasswordParamsSchema {
  return changePasswordParamsSchema.parse({
    currentPassword: "OldPassword123",
    newPassword: "NewPassword456",
    ...overrides
  });
}

/**
 * テスト用のパスワードリセットパラメータを作成する
 * @param overrides 上書きするプロパティ
 * @returns パスワードリセットパラメータ
 */
export function createTestResetPasswordParams(overrides: Partial<ResetPasswordParamsSchema> = {}): ResetPasswordParamsSchema {
  return resetPasswordParamsSchema.parse({
    token: "reset-token-456",
    newPassword: "NewPassword456",
    ...overrides
  });
}

/**
 * 無効なユーザーデータを作成する（バリデーションエラーのテスト用）
 * @returns 無効なユーザーデータ
 */
export function createInvalidUserData(): Record<string, unknown> {
  return {
    id: "user-123",
    username: "u", // 短すぎる（3文字以上必要）
    email: "invalid-email", // 無効なメールアドレス
    displayName: "", // 空（1文字以上必要）
    profile: {
      bio: "テストユーザーのプロフィールです。",
      avatarUrl: "invalid-url", // 無効なURL
      websiteUrl: "invalid-url", // 無効なURL
      location: "東京"
    },
    status: "unknown", // 無効なステータス
    createdAt: new Date("2023-01-01T00:00:00Z"),
    updatedAt: new Date("2023-01-02T00:00:00Z")
  };
}

/**
 * 無効なパスワードを作成する（バリデーションエラーのテスト用）
 * @returns 無効なパスワード
 */
export function createInvalidPassword(): string {
  return "password"; // 大文字と数字が含まれていない
} 