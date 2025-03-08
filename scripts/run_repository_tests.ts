/**
 * リポジトリテスト実行スクリプト
 * 
 * このスクリプトは、dotenvを使用して環境変数を読み込み、
 * 各リポジトリのテストを実行します。
 */

// 環境変数を読み込む
import { load } from "jsr:@std/dotenv@^0.218.2";
await load({ export: true });

// テスト実行
console.log("リポジトリテストを実行します...");

/**
 * テスト実行結果を表示する関数
 */
async function runTest(testName: string, testPath: string): Promise<number> {
  console.log(`\n${testName}`);
  
  const command = new Deno.Command("deno", {
    args: ["test", "-A", "--env-file=.env", testPath],
    stdout: "piped",
    stderr: "piped",
  });
  
  const output = await command.output();
  const stdout = new TextDecoder().decode(output.stdout);
  const stderr = new TextDecoder().decode(output.stderr);
  
  console.log("--- 標準出力 ---");
  console.log(stdout || "(出力なし)");
  
  if (stderr) {
    console.log("--- エラー出力 ---");
    console.log(stderr);
  }
  
  console.log(`テスト結果: ${output.code === 0 ? "✅ 成功" : "❌ 失敗"}`);
  return output.code;
}

// 1. ユーザーリポジトリのテスト
const userRepoTestCode = await runTest(
  "1. ユーザーリポジトリのテスト", 
  "src/infrastructure/repositories/drizzle-user-repository.test.ts"
);

// 2. コンテンツリポジトリのテスト
const contentRepoTestCode = await runTest(
  "2. コンテンツリポジトリのテスト", 
  "src/infrastructure/repositories/drizzle-content-repository.test.ts"
);

// 3. リポジトリリポジトリのテスト
const repoRepoTestCode = await runTest(
  "3. リポジトリリポジトリのテスト", 
  "src/infrastructure/repositories/drizzle-repository-repository.test.ts"
);

// 4. フィードリポジトリのテスト
const feedRepoTestCode = await runTest(
  "4. フィードリポジトリのテスト", 
  "src/infrastructure/repositories/delivery/drizzle-feed-repository.test.ts"
);

// 結果のサマリーを表示
console.log("\n===== テスト結果サマリー =====");
console.log(`1. ユーザーリポジトリ: ${userRepoTestCode === 0 ? "✅ 成功" : "❌ 失敗"}`);
console.log(`2. コンテンツリポジトリ: ${contentRepoTestCode === 0 ? "✅ 成功" : "❌ 失敗"}`);
console.log(`3. リポジトリリポジトリ: ${repoRepoTestCode === 0 ? "✅ 成功" : "❌ 失敗"}`);
console.log(`4. フィードリポジトリ: ${feedRepoTestCode === 0 ? "✅ 成功" : "❌ 失敗"}`);

// 全体の結果
const allSuccess = 
  userRepoTestCode === 0 && 
  contentRepoTestCode === 0 && 
  repoRepoTestCode === 0 && 
  feedRepoTestCode === 0;

console.log(`\n全体結果: ${allSuccess ? "✅ すべてのテストが成功しました" : "❌ 一部のテストが失敗しました"}`);

// 終了コードを設定
Deno.exit(allSuccess ? 0 : 1); 