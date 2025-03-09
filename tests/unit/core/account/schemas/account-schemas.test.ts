/**
 * アカウントスキーマのテスト
 */

import { expect } from "@std/expect";
import { describe, it } from "@std/testing/bdd";
import { z } from "../../../../../src/deps.ts";
import {
  emailSchema,
  passwordSchema,
  usernameSchema,
  displayNameSchema,
  profileSchema,
  accountStatusSchema,
  userSchema,
  createUserParamsSchema,
  updateUserParamsSchema,
  credentialsSchema,
  tokenSchema,
  authResultSchema,
  passwordResetTokenSchema,
  changePasswordParamsSchema,
  resetPasswordParamsSchema
} from "../../../../../src/core/account/schemas/mod.ts";
import {
  createTestUser,
  createTestProfile,
  createTestUserParams,
  createTestUpdateUserParams,
  createTestCredentials,
  createTestAuthResult,
  createTestPasswordResetToken,
  createTestChangePasswordParams,
  createTestResetPasswordParams,
  createInvalidUserData,
  createInvalidPassword
} from "../../../../helpers/account-test-factory.ts";

describe("アカウントスキーマ", () => {
  describe("emailSchema", () => {
    it("有効なメールアドレスの場合、バリデーションが成功すること", () => {
      const email = "test@example.com";
      const result = emailSchema.safeParse(email);
      expect(result.success).toBe(true);
    });

    it("無効なメールアドレスの場合、バリデーションが失敗すること", () => {
      const email = "invalid-email";
      const result = emailSchema.safeParse(email);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("有効なメールアドレス");
      }
    });
  });

  describe("passwordSchema", () => {
    it("有効なパスワードの場合、バリデーションが成功すること", () => {
      const password = "Password123";
      const result = passwordSchema.safeParse(password);
      expect(result.success).toBe(true);
    });

    it("短すぎるパスワードの場合、バリデーションが失敗すること", () => {
      const password = "Pass1";
      const result = passwordSchema.safeParse(password);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("8文字以上");
      }
    });

    it("大文字を含まないパスワードの場合、バリデーションが失敗すること", () => {
      const password = "password123";
      const result = passwordSchema.safeParse(password);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("大文字");
      }
    });

    it("小文字を含まないパスワードの場合、バリデーションが失敗すること", () => {
      const password = "PASSWORD123";
      const result = passwordSchema.safeParse(password);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("小文字");
      }
    });

    it("数字を含まないパスワードの場合、バリデーションが失敗すること", () => {
      const password = "PasswordABC";
      const result = passwordSchema.safeParse(password);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("数字");
      }
    });
  });

  describe("usernameSchema", () => {
    it("有効なユーザー名の場合、バリデーションが成功すること", () => {
      const username = "testuser";
      const result = usernameSchema.safeParse(username);
      expect(result.success).toBe(true);
    });

    it("短すぎるユーザー名の場合、バリデーションが失敗すること", () => {
      const username = "te";
      const result = usernameSchema.safeParse(username);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("3文字以上");
      }
    });

    it("無効な文字を含むユーザー名の場合、バリデーションが失敗すること", () => {
      const username = "test@user";
      const result = usernameSchema.safeParse(username);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("英数字、アンダースコア、ハイフン");
      }
    });
  });

  describe("profileSchema", () => {
    it("有効なプロフィールの場合、バリデーションが成功すること", () => {
      const profile = createTestProfile();
      const result = profileSchema.safeParse(profile);
      expect(result.success).toBe(true);
    });

    it("無効なURLを含むプロフィールの場合、バリデーションが失敗すること", () => {
      const profile = {
        bio: "テストユーザーのプロフィールです。",
        avatarUrl: "invalid-url",
        websiteUrl: "https://example.com",
        location: "東京"
      };
      const result = profileSchema.safeParse(profile);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("有効なURL");
      }
    });
  });

  describe("userSchema", () => {
    it("有効なユーザーデータの場合、バリデーションが成功すること", () => {
      const user = createTestUser();
      const result = userSchema.safeParse(user);
      expect(result.success).toBe(true);
    });

    it("無効なユーザーデータの場合、バリデーションが失敗すること", () => {
      const invalidUser = createInvalidUserData();
      const result = userSchema.safeParse(invalidUser);
      expect(result.success).toBe(false);
    });
  });

  describe("createUserParamsSchema", () => {
    it("有効なユーザー作成パラメータの場合、バリデーションが成功すること", () => {
      const params = createTestUserParams();
      const result = createUserParamsSchema.safeParse(params);
      expect(result.success).toBe(true);
    });

    it("無効なパスワードを含むユーザー作成パラメータの場合、バリデーションが失敗すること", () => {
      const params = {
        ...createTestUserParams(),
        password: createInvalidPassword()
      };
      const result = createUserParamsSchema.safeParse(params);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("password");
      }
    });
  });

  describe("updateUserParamsSchema", () => {
    it("有効なユーザー更新パラメータの場合、バリデーションが成功すること", () => {
      const params = createTestUpdateUserParams();
      const result = updateUserParamsSchema.safeParse(params);
      expect(result.success).toBe(true);
    });

    it("部分的な更新パラメータの場合、バリデーションが成功すること", () => {
      const params = {
        displayName: "更新されたユーザー名"
      };
      const result = updateUserParamsSchema.safeParse(params);
      expect(result.success).toBe(true);
    });
  });

  describe("credentialsSchema", () => {
    it("有効な認証情報の場合、バリデーションが成功すること", () => {
      const credentials = createTestCredentials();
      const result = credentialsSchema.safeParse(credentials);
      expect(result.success).toBe(true);
    });

    it("無効なメールアドレスを含む認証情報の場合、バリデーションが失敗すること", () => {
      const credentials = {
        ...createTestCredentials(),
        email: "invalid-email"
      };
      const result = credentialsSchema.safeParse(credentials);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("email");
      }
    });
  });

  describe("changePasswordParamsSchema", () => {
    it("有効なパスワード変更パラメータの場合、バリデーションが成功すること", () => {
      const params = createTestChangePasswordParams();
      const result = changePasswordParamsSchema.safeParse(params);
      expect(result.success).toBe(true);
    });

    it("現在のパスワードと新しいパスワードが同じ場合、バリデーションが失敗すること", () => {
      const params = {
        currentPassword: "Password123",
        newPassword: "Password123"
      };
      const result = changePasswordParamsSchema.safeParse(params);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("異なる必要があります");
      }
    });
  });

  describe("resetPasswordParamsSchema", () => {
    it("有効なパスワードリセットパラメータの場合、バリデーションが成功すること", () => {
      const params = createTestResetPasswordParams();
      const result = resetPasswordParamsSchema.safeParse(params);
      expect(result.success).toBe(true);
    });

    it("無効なパスワードを含むパスワードリセットパラメータの場合、バリデーションが失敗すること", () => {
      const params = {
        ...createTestResetPasswordParams(),
        newPassword: createInvalidPassword()
      };
      const result = resetPasswordParamsSchema.safeParse(params);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("newPassword");
      }
    });
  });
}); 