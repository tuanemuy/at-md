# 依存関係管理戦略

このドキュメントでは、AT-MDプロジェクトにおける依存関係の管理戦略について説明します。

## 1. 依存関係の方向性

AT-MDプロジェクトでは、クリーンアーキテクチャの原則に従い、依存関係の方向は内側に向かうように設計されています。

```
外部 → インフラストラクチャ層 → アプリケーション層 → ドメイン層（コア）
```

各レイヤーは、自分より内側のレイヤーに依存することができますが、外側のレイヤーに依存することはできません。

## 2. 依存関係の管理方法

### 2.1 外部依存の一元管理

プロジェクト全体で使用される外部依存は、ルートの`deps.ts`ファイルで一元管理されています。

```typescript
// src/deps.ts
export { z } from "npm:zod";
export { Result, ok, err } from "npm:neverthrow";
// ...
```

### 2.2 コンテキストごとの依存関係管理

各境界づけられたコンテキストは、自身の`deps.ts`ファイルを持ち、そのコンテキスト内で使用される依存関係を管理します。

```
src/
  ├── core/
  │   ├── content/
  │   │   ├── deps.ts  // コアレイヤーのコンテンツコンテキスト依存
  │   │   └── ...
  │   └── ...
  ├── application/
  │   ├── content/
  │   │   ├── deps.ts  // アプリケーションレイヤーのコンテンツコンテキスト依存
  │   │   └── ...
  │   └── ...
  ├── infrastructure/
  │   ├── content/
  │   │   ├── deps.ts  // インフラストラクチャレイヤーのコンテンツコンテキスト依存
  │   │   └── ...
  │   └── ...
  └── deps.ts  // プロジェクト全体の外部依存
```

### 2.3 依存関係の参照ルール

1. 各モジュールは、同じコンテキスト内の他のモジュールを直接参照できます。
2. 他のコンテキストのモジュールを参照する場合は、そのコンテキストの`mod.ts`を通じて参照します。
3. 外部依存を参照する場合は、コンテキストの`deps.ts`を通じて参照します。

## 3. 依存関係の検証

依存関係が正しく管理されているかを検証するために、以下の方法を使用します。

### 3.1 静的解析

```bash
deno check src/**/*.ts
```

### 3.2 循環参照の検出

```bash
deno run -A scripts/check_circular_deps.ts
```

### 3.3 未使用依存の検出

```bash
deno run -A npm:tsr 'mod\.ts$'
```

## 4. 依存性注入

アプリケーション内での依存性注入は、コンストラクタインジェクションパターンを使用して実装されています。

```typescript
// 依存性注入の例
export class ContentService {
  constructor(
    private readonly contentRepository: ContentRepository,
    private readonly repositoryRepository: RepositoryRepository
  ) {}
  
  // ...
}
```

## 5. モジュール間の依存関係図

```mermaid
graph TD
    subgraph "コアレイヤー"
        CC[コンテンツコンテキスト]
        AC[アカウントコンテキスト]
        DC[配信コンテキスト]
        PC[表示コンテキスト]
        Common[共通モジュール]
    end
    
    subgraph "アプリケーションレイヤー"
        CApp[コンテンツアプリケーション]
        AApp[アカウントアプリケーション]
        DApp[配信アプリケーション]
        PApp[表示アプリケーション]
    end
    
    subgraph "インフラストラクチャレイヤー"
        CInfra[コンテンツインフラ]
        AInfra[アカウントインフラ]
        DInfra[配信インフラ]
        PInfra[表示インフラ]
    end
    
    Common --> CC
    Common --> AC
    Common --> DC
    Common --> PC
    
    CC --> CApp
    AC --> AApp
    DC --> DApp
    PC --> PApp
    
    CApp --> CInfra
    AApp --> AInfra
    DApp --> DInfra
    PApp --> PInfra
</code_block_to_apply_changes_from> 