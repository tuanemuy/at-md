/**
 * AT-MD アプリケーションのエントリーポイント
 */

import { serve } from "jsr:@std/http@^0.218.2/server";
import { createApp } from "./presentation/rest/app/app.ts";

// 環境変数の読み込み
const PORT = parseInt(Deno.env.get("PORT") || "8000");
const HOST = Deno.env.get("HOST") || "localhost";

// アプリケーションの作成
const app = createApp();

// サーバーの起動
console.log(`サーバーを起動します: http://${HOST}:${PORT}`);
await serve(app.fetch, { port: PORT, hostname: HOST }); 