/**
 * アカウント関連のZodスキーマ定義
 * 
 * アカウントドメインで使用するZodスキーマを定義します。
 */

import { z } from "../../../deps.ts";
import {
  idSchema,
  userIdSchema,
  dateSchema,
} from "../../common/schemas/base-schemas.ts";

/**
 * メールアドレス用のスキーマ
 */
export const emailSchema = z.string().email({ message: "有効なメールアドレスを入力してください" }).brand<"Email">();
export type Email = z.infer<typeof emailSchema>;

/**
 * パスワード用のスキーマ
 */
export const passwordSchema = z.string()
  .min(8, { message: "パスワードは8文字以上である必要があります" })
  .regex(/[A-Z]/, { message: "パスワードには大文字を含める必要があります" })
  .regex(/[a-z]/, { message: "パスワードには小文字を含める必要があります" })
  .regex(/[0-9]/, { message: "パスワードには数字を含める必要があります" })
  .brand<"Password">();
export type Password = z.infer<typeof passwordSchema>;

/**
 * ユーザー名用のスキーマ
 */
export const usernameSchema = z.string()
  .min(3, { message: "ユーザー名は3文字以上である必要があります" })
  .max(20, { message: "ユーザー名は20文字以下である必要があります" })
  .regex(/^[a-zA-Z0-9_-]+$/, { message: "ユーザー名には英数字、アンダースコア、ハイフンのみ使用できます" })
  .brand<"Username">();
export type Username = z.infer<typeof usernameSchema>;

/**
 * 表示名用のスキーマ
 */
export const displayNameSchema = z.string()
  .min(1, { message: "表示名は1文字以上である必要があります" })
  .max(50, { message: "表示名は50文字以下である必要があります" })
  .brand<"DisplayName">();
export type DisplayName = z.infer<typeof displayNameSchema>;

/**
 * プロフィール用のスキーマ
 */
export const profileSchema = z.object({
  bio: z.string().max(200, { message: "自己紹介は200文字以下である必要があります" }).optional(),
  avatarUrl: z.string().url({ message: "有効なURLを入力してください" }).optional(),
  websiteUrl: z.string().url({ message: "有効なURLを入力してください" }).optional(),
  location: z.string().max(100, { message: "場所は100文字以下である必要があります" }).optional(),
});
export type ProfileSchema = z.infer<typeof profileSchema>;

/**
 * アカウント状態用のスキーマ
 */
export const accountStatusSchema = z.enum(["active", "suspended", "deleted"]);
export type AccountStatus = z.infer<typeof accountStatusSchema>;

/**
 * ユーザーエンティティのスキーマ
 */
export const userSchema = z.object({
  id: userIdSchema,
  username: usernameSchema,
  email: emailSchema,
  displayName: displayNameSchema,
  profile: profileSchema,
  status: accountStatusSchema,
  createdAt: dateSchema,
  updatedAt: dateSchema,
  lastLoginAt: dateSchema.optional(),
});
export type UserSchema = z.infer<typeof userSchema>;

/**
 * ユーザー作成パラメータのスキーマ
 */
export const createUserParamsSchema = z.object({
  username: usernameSchema,
  email: emailSchema,
  password: passwordSchema,
  displayName: displayNameSchema,
  profile: profileSchema.optional(),
});
export type CreateUserParamsSchema = z.infer<typeof createUserParamsSchema>;

/**
 * ユーザー更新パラメータのスキーマ
 */
export const updateUserParamsSchema = z.object({
  displayName: displayNameSchema.optional(),
  profile: profileSchema.optional(),
});
export type UpdateUserParamsSchema = z.infer<typeof updateUserParamsSchema>;

/**
 * 認証情報のスキーマ
 */
export const credentialsSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});
export type CredentialsSchema = z.infer<typeof credentialsSchema>;

/**
 * トークン用のスキーマ
 */
export const tokenSchema = z.string().min(1).brand<"Token">();
export type Token = z.infer<typeof tokenSchema>;

/**
 * 認証結果のスキーマ
 */
export const authResultSchema = z.object({
  user: userSchema,
  token: tokenSchema,
});
export type AuthResultSchema = z.infer<typeof authResultSchema>;

/**
 * パスワードリセットトークン用のスキーマ
 */
export const passwordResetTokenSchema = z.object({
  userId: userIdSchema,
  token: tokenSchema,
  expiresAt: dateSchema,
});
export type PasswordResetTokenSchema = z.infer<typeof passwordResetTokenSchema>;

/**
 * パスワード変更パラメータのスキーマ
 */
export const changePasswordParamsSchema = z.object({
  currentPassword: passwordSchema,
  newPassword: passwordSchema,
}).refine(
  (data) => data.currentPassword !== data.newPassword,
  { message: "新しいパスワードは現在のパスワードと異なる必要があります", path: ["newPassword"] }
);
export type ChangePasswordParamsSchema = z.infer<typeof changePasswordParamsSchema>;

/**
 * パスワードリセットパラメータのスキーマ
 */
export const resetPasswordParamsSchema = z.object({
  token: tokenSchema,
  newPassword: passwordSchema,
});
export type ResetPasswordParamsSchema = z.infer<typeof resetPasswordParamsSchema>; 