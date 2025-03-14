# システムワークフロー

これはGitHunに保存されたMarkdownテキストを

- データベースに保存
- Bluesky（AT Protocol）に投稿

し、Webページとして表示するシステムです。

```mermaid
flowchart TB
    subgraph Integration["統合層"]
        GitHub["GitHub<br/>[Software System]<br/>ノート管理"]
        Bluesky["Bluesky<br/>[Software System]<br/>ソーシャル基盤"]
    end

    subgraph Client["クライアント層"]
        WebApp["Webアプリ<br/>[Container]<br/>Next.js"]
    end

    subgraph Backend["バックエンド層"]
        WebServer["Webサーバー<br/>[Container]<br/>Next.js"]
        DB["データベース<br/>[Container]<br/>データ永続化"]
        subgraph Function["Function"]
            GitHubSyncFn["GitHub同期関数<br/>[Container]<br/>ノート同期処理"]
        end
    end

    subgraph Users["ユーザー層"]
        User["作成者<br/>[Person]"]
        Guest["閲覧者<br/>[Person]"]
    end

    %% アカウント管理フロー
    User -->|A.1 アカウント登録| Bluesky
    User -->|A.2 BlueskyによるSSO| WebApp
    WebServer -->|A.3 GitHub Appsインストール| GitHub

    %% ノート作成・配信フロー
    User -->|B.1 プッシュ| GitHub
    GitHub -->|B.2 Webhook| GitHubSyncFn
    GitHubSyncFn -->|B.3 保存| DB
    GitHubSyncFn -->|B.4 投稿| Bluesky
    DB -->|B.5 データ取得| WebServer
    Bluesky -->|B.6 メタデータ取得| WebServer
    WebServer -->|B.7 データ取得| WebApp
    WebApp -->|B.8 表示| Guest

    classDef container fill:#1168bd,stroke:#0b4884,color:#ffffff
    classDef system fill:#666,stroke:#0b4884,color:#ffffff
    classDef person fill:#08427b,stroke:#052e56,color:#ffffff
    
    class User,Guest person
    class GitHub,Bluesky,Obsidian system
    class WebServer,WebApp,GitHubSyncFn,FeedSyncFn,DB container
```

## 凡例

- Person: システムのユーザー（青色）
- Software System: 外部システム（灰色）
- Container: 内部コンポーネント（水色）
- A.x: アカウント管理フロー
- B.x: ノート作成・配信フロー
