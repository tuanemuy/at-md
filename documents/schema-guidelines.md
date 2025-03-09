# Zodスキーマ使用ガイドライン

このドキュメントでは、AT-MDプロジェクトにおけるZodスキーマの使用方法とベストプラクティスについて説明します。

## 目的

Zodスキーマを導入する主な目的は以下の通りです：

1. **型安全性の向上**: ランタイムでの型チェックを行い、型の不一致によるバグを防止する
2. **バリデーションの一元管理**: データの検証ロジックを一箇所に集約し、一貫性を確保する
3. **ドキュメンテーション**: スキーマ定義がそのままデータ構造のドキュメントとなる
4. **テストの容易化**: スキーマを使用してテストデータの生成や検証を簡素化する

## ディレクトリ構造

Zodスキーマは以下のディレクトリ構造で管理します：

```
src/
  core/
    common/
      schemas/
        base-schemas.ts  # 基本的なスキーマ定義
        mod.ts           # エクスポート用モジュール
    [domain]/
      schemas/
        [domain]-schemas.ts  # ドメイン固有のスキーマ定義
        mod.ts               # エクスポート用モジュール
```

## 命名規則

### スキーマ変数

- スキーマ変数名は `camelCase` で、末尾に `Schema` を付ける
  - 例: `userSchema`, `contentMetadataSchema`

### 型定義

- スキーマから生成される型名は `PascalCase` で、末尾に `Schema` を付ける
  - 例: `type UserSchema = z.infer<typeof userSchema>`

### ブランド型

- ブランド型を使用する場合、型名は `PascalCase` で簡潔な名前を使用する
  - 例: `type UserID = z.infer<typeof userIdSchema>`

## スキーマ定義のベストプラクティス

### 1. 基本型の定義

基本的な型は `src/core/common/schemas/base-schemas.ts` に定義し、ブランド型を活用して型安全性を高めます。

```typescript
// 良い例
export const idSchema = z.string().min(1).brand<"ID">();
export type ID = z.infer<typeof idSchema>;

export const userIdSchema = idSchema.brand<"UserID">();
export type UserID = z.infer<typeof userIdSchema>;
```

### 2. スキーマの再利用

スキーマは可能な限り再利用し、重複を避けます。

```typescript
// 良い例
export const metadataBaseSchema = z.object({
  createdAt: dateSchema,
  updatedAt: dateSchema
});

export const userSchema = z.object({
  id: userIdSchema,
  name: nameSchema,
  email: emailSchema
}).merge(metadataBaseSchema);
```

### 3. バリデーションの詳細化

エラーメッセージを明確にし、バリデーションの理由を説明します。

```typescript
// 良い例
export const emailSchema = z.string().email({ message: "有効なメールアドレスを入力してください" });

export const passwordSchema = z.string()
  .min(8, { message: "パスワードは8文字以上である必要があります" })
  .regex(/[A-Z]/, { message: "パスワードには大文字を含める必要があります" })
  .regex(/[a-z]/, { message: "パスワードには小文字を含める必要があります" })
  .regex(/[0-9]/, { message: "パスワードには数字を含める必要があります" });
```

### 4. 複雑なバリデーション

複雑なバリデーションには `.refine()` メソッドを使用します。

```typescript
// 良い例
export const dateRangeSchema = z.object({
  startDate: dateSchema,
  endDate: dateSchema
}).refine(
  (data) => data.startDate <= data.endDate,
  { message: "開始日は終了日以前である必要があります", path: ["startDate"] }
);
```

### 5. 部分的な更新

部分的な更新には `.partial()` メソッドを使用します。

```typescript
// 良い例
export const updateUserSchema = userSchema.partial();
```

## バリデーションエラーの処理

### 1. エラー処理の標準化

バリデーションエラーは `Result` 型を使用して処理します。

```typescript
import { Result, ok, err } from "neverthrow";
import { z } from "zod";

export function validateUser(data: unknown): Result<UserSchema, ValidationError> {
  try {
    const validatedUser = userSchema.parse(data);
    return ok(validatedUser);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return err({
        type: "validation_error",
        message: "ユーザーデータのバリデーションに失敗しました",
        details: error.format()
      });
    }
    return err({
      type: "unknown_error",
      message: "不明なエラーが発生しました"
    });
  }
}
```

### 2. エラーメッセージのフォーマット

エラーメッセージは一貫したフォーマットで返します。

```typescript
export type ValidationError = {
  type: "validation_error";
  message: string;
  details: z.ZodFormattedError<any>;
} | {
  type: "unknown_error";
  message: string;
};
```

## テストでの使用

### 1. テストデータの生成

テストデータの生成には `.parse()` メソッドを使用します。

```typescript
// テストデータファクトリの例
export function createTestUser(overrides?: Partial<UserSchema>): UserSchema {
  const defaultUser = {
    id: "user-1",
    name: "テストユーザー",
    email: "test@example.com",
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  return userSchema.parse({
    ...defaultUser,
    ...overrides
  });
}
```

### 2. バリデーションのテスト

バリデーションのテストには `.safeParse()` メソッドを使用します。

```typescript
import { expect } from "@std/expect";
import { test } from "@std/testing/bdd";

test("有効なユーザーデータの場合、バリデーションが成功すること", () => {
  const userData = {
    id: "user-1",
    name: "テストユーザー",
    email: "test@example.com",
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  const result = userSchema.safeParse(userData);
  expect(result.success).toBe(true);
});

test("無効なメールアドレスの場合、バリデーションが失敗すること", () => {
  const userData = {
    id: "user-1",
    name: "テストユーザー",
    email: "invalid-email",
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  const result = userSchema.safeParse(userData);
  expect(result.success).toBe(false);
  if (!result.success) {
    expect(result.error.issues[0].path).toContain("email");
  }
});
```

## パフォーマンスの考慮事項

### 1. スキーマの再利用

同じスキーマを複数回定義せず、一度定義したスキーマを再利用します。

### 2. バリデーションの最適化

頻繁に実行されるバリデーションでは、必要最小限のバリデーションルールを使用します。

### 3. キャッシュの活用

同じデータに対して繰り返しバリデーションを行う場合は、結果をキャッシュすることを検討します。

## 移行戦略

既存のコードをZodスキーマに移行する際は、以下の手順で進めます：

1. 基本的なスキーマを定義する
2. 既存の型定義をスキーマに置き換える
3. バリデーションロジックをスキーマに統合する
4. テストを更新する
5. エラー処理を標準化する

## 注意点

- スキーマ定義は可能な限り単純に保ち、複雑なロジックは避ける
- バリデーションエラーは明確で具体的なメッセージを提供する
- スキーマの変更は慎重に行い、既存のコードへの影響を考慮する
- 循環参照を避け、スキーマ間の依存関係を明確にする 