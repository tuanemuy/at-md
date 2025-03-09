/**
 * 依存関係の検証スクリプト
 * 
 * このスクリプトは、プロジェクト内の依存関係が正しく管理されているかを検証します。
 * 以下の項目をチェックします：
 * 1. モジュール間のimportが`mod.ts`を経由しているか
 * 2. 他のモジュールのファイルを直接参照していないか
 * 3. 依存関係の方向性が正しいか
 */

import { walk } from "https://deno.land/std@0.218.2/fs/walk.ts";
import { dirname, relative, join } from "https://deno.land/std@0.218.2/path/mod.ts";

// 検証対象のディレクトリ
const SRC_DIR = "./src";

// レイヤーの優先順位（内側から外側）
const LAYERS = ["core", "application", "infrastructure", "presentation"];

// 無視するファイル
const IGNORE_FILES = [
  "deps.ts",
  "mod.ts",
  "main.ts",
];

// 無視するディレクトリ
const IGNORE_DIRS = [
  new RegExp("node_modules"),
  new RegExp(".git"),
];

// 問題のあるインポートを格納する配列
const issues: string[] = [];

/**
 * ファイルの依存関係を検証する
 * @param filePath 検証対象のファイルパス
 */
async function validateFile(filePath: string): Promise<void> {
  // 無視するファイルはスキップ
  if (IGNORE_FILES.some(f => filePath.endsWith(f))) {
    return;
  }
  
  // ファイルの内容を読み込む
  const content = await Deno.readTextFile(filePath);
  
  // インポート文を抽出
  const importRegex = /import\s+(?:[\w\s{},*]+\s+from\s+)?["']([^"']+)["'];?/g;
  let match;
  
  while ((match = importRegex.exec(content)) !== null) {
    const importPath = match[1];
    
    // 外部モジュールはスキップ
    if (!importPath.startsWith(".")) {
      continue;
    }
    
    // 相対パスを絶対パスに変換
    const absoluteImportPath = join(dirname(filePath), importPath);
    const normalizedImportPath = absoluteImportPath.replace(/\\/g, "/");
    
    // 同じモジュール内のインポートはスキップ
    const fileModule = getModule(filePath);
    const importModule = getModule(normalizedImportPath);
    
    if (fileModule === importModule) {
      continue;
    }
    
    // mod.tsを経由していないインポートをチェック
    if (!importPath.endsWith("/mod.ts") && !importPath.endsWith("/deps.ts")) {
      issues.push(`${filePath}: モジュール間のインポートが mod.ts または deps.ts を経由していません: ${importPath}`);
    }
    
    // 依存関係の方向性をチェック
    const fileLayer = getLayer(filePath);
    const importLayer = getLayer(normalizedImportPath);
    
    if (fileLayer && importLayer) {
      const fileLayerIndex = LAYERS.indexOf(fileLayer);
      const importLayerIndex = LAYERS.indexOf(importLayer);
      
      if (fileLayerIndex < importLayerIndex) {
        issues.push(`${filePath}: 内側のレイヤー(${fileLayer})が外側のレイヤー(${importLayer})に依存しています: ${importPath}`);
      }
    }
  }
}

/**
 * ファイルのモジュールを取得する
 * @param filePath ファイルパス
 * @returns モジュール名
 */
function getModule(filePath: string): string {
  const relativePath = relative(SRC_DIR, filePath).replace(/\\/g, "/");
  const parts = relativePath.split("/");
  
  if (parts.length >= 2) {
    return `${parts[0]}/${parts[1]}`;
  }
  
  return relativePath;
}

/**
 * ファイルのレイヤーを取得する
 * @param filePath ファイルパス
 * @returns レイヤー名
 */
function getLayer(filePath: string): string | null {
  const relativePath = relative(SRC_DIR, filePath).replace(/\\/g, "/");
  const parts = relativePath.split("/");
  
  if (parts.length >= 1 && LAYERS.includes(parts[0])) {
    return parts[0];
  }
  
  return null;
}

/**
 * メイン関数
 */
async function main() {
  console.log("依存関係の検証を開始します...");
  
  // ソースディレクトリ内のすべてのTypeScriptファイルを検証
  for await (const entry of walk(SRC_DIR, {
    exts: [".ts"],
    skip: IGNORE_DIRS,
  })) {
    if (entry.isFile) {
      await validateFile(entry.path);
    }
  }
  
  // 結果の表示
  if (issues.length === 0) {
    console.log("問題は見つかりませんでした。依存関係は正しく管理されています。");
  } else {
    console.log(`${issues.length}個の問題が見つかりました：`);
    issues.forEach((issue, index) => {
      console.log(`${index + 1}. ${issue}`);
    });
    Deno.exit(1);
  }
}

// スクリプトの実行
if (import.meta.main) {
  await main();
} 