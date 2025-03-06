# システムワークフロー

このドキュメントでは、AT-MDシステムの全体的なワークフローを図解します。このワークフローは、[domain-model.md](./domain-model.md)でのドメイン分析の基礎となり、システムの主要なコンポーネントとその相互作用を示しています。

```mermaid
flowchart TB
    subgraph Integration["統合層"]
        GitHub["GitHub<br/>[Software System]<br/>コンテンツ管理"]
        ATProtocol["AT Protocol<br/>[Software System]<br/>ソーシャル基盤"]
    end

    subgraph Client["クライアント層"]
        Obsidian["Obsidian<br/>[Software System]<br/>マークダウン編集"]
        WebApp["Webアプリ<br/>[Container]<br/>Next.js"]
    end

    subgraph Backend["バックエンド層"]
        WebServer["Webサーバー<br/>[Container]<br/>Next.js"]
        DB["データベース<br/>[Container]<br/>データ永続化"]
        subgraph Function["Function"]
            GitHubSyncFn["GitHub同期関数<br/>[Container]<br/>コンテンツ同期処理"]
            FeedSyncFn["フィード同期関数<br/>[Container]<br/>フィード同期処理"]
        end
    end

    subgraph Users["ユーザー層"]
        User["作成者<br/>[Person]"]
        Guest["閲覧者<br/>[Person]"]
    end

    %% アカウント管理フロー
    User -->|A.1 アカウント登録| ATProtocol
    User -->|A.2 SSO| WebApp
    WebApp -->|A.3 OAuth要求| WebServer
    WebServer -->|A.4 OAuth認証| ATProtocol
    ATProtocol -->|A.5 トークン発行| WebServer
    WebServer -->|A.6 トークン保存| DB
    WebServer -->|A.7 GitHub Apps認証| GitHub
    GitHub -->|A.8 GitHub Appsインストール| WebServer

    %% コンテンツ作成・配信フロー
    User -->|B.1 編集| Obsidian
    Obsidian -->|B.2 プッシュ| GitHub
    GitHub -->|B.3 Webhook| GitHubSyncFn
    GitHubSyncFn -->|B.4 保存| DB
    GitHubSyncFn -->|B.5 配信| ATProtocol
    ATProtocol -->|B.6 更新通知| FeedSyncFn
    FeedSyncFn -->|B.7 保存| DB
    DB -->|B.8 データ取得| WebServer
    WebServer -->|B.9 ページ生成| WebApp
    WebApp -->|B.10 表示| Guest

    classDef container fill:#1168bd,stroke:#0b4884,color:#ffffff
    classDef system fill:#666,stroke:#0b4884,color:#ffffff
    classDef person fill:#08427b,stroke:#052e56,color:#ffffff
    
    class User,Guest person
    class GitHub,ATProtocol,Obsidian system
    class WebServer,WebApp,GitHubSyncFn,FeedSyncFn,DB container
```

## 凡例

- Person: システムのユーザー（青色）
- Software System: 外部システム（灰色）
- Container: 内部コンポーネント（水色）
- A.x: アカウント管理フロー
- B.x: コンテンツ作成・配信フロー
