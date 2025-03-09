/**
 * 循環参照の検出スクリプト
 * 
 * このスクリプトは、プロジェクト内の循環参照を検出します。
 * 以下の項目をチェックします：
 * 1. モジュール間の循環参照
 * 2. ファイル間の循環参照
 */

import { walk } from "https://deno.land/std@0.218.2/fs/walk.ts";
import { dirname, relative, join } from "https://deno.land/std@0.218.2/path/mod.ts";

// 検証対象のディレクトリ
const SRC_DIR = "./src";

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

// 依存関係グラフ
type DependencyGraph = Map<string, Set<string>>;
const fileGraph: DependencyGraph = new Map();
const moduleGraph: DependencyGraph = new Map();

/**
 * ファイルの依存関係を解析する
 * @param filePath 解析対象のファイルパス
 */
async function analyzeFile(filePath: string): Promise<void> {
  // 無視するファイルはスキップ
  if (IGNORE_FILES.some(f => filePath.endsWith(f))) {
    return;
  }
  
  // ファイルの内容を読み込む
  const content = await Deno.readTextFile(filePath);
  
  // ファイルの依存関係を初期化
  if (!fileGraph.has(filePath)) {
    fileGraph.set(filePath, new Set());
  }
  
  // モジュールの依存関係を初期化
  const fileModule = getModule(filePath);
  if (fileModule && !moduleGraph.has(fileModule)) {
    moduleGraph.set(fileModule, new Set());
  }
  
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
    
    // ファイルの依存関係を追加
    fileGraph.get(filePath)?.add(normalizedImportPath);
    
    // モジュールの依存関係を追加
    const importModule = getModule(normalizedImportPath);
    if (fileModule && importModule && fileModule !== importModule) {
      moduleGraph.get(fileModule)?.add(importModule);
    }
  }
}

/**
 * ファイルのモジュールを取得する
 * @param filePath ファイルパス
 * @returns モジュール名
 */
function getModule(filePath: string): string | null {
  const relativePath = relative(SRC_DIR, filePath).replace(/\\/g, "/");
  const parts = relativePath.split("/");
  
  if (parts.length >= 2) {
    return `${parts[0]}/${parts[1]}`;
  }
  
  return null;
}

/**
 * 循環参照を検出する
 * @param graph 依存関係グラフ
 * @returns 循環参照のリスト
 */
function detectCycles(graph: DependencyGraph): string[][] {
  const cycles: string[][] = [];
  const visited = new Set<string>();
  const stack = new Set<string>();
  
  function dfs(node: string, path: string[] = []): void {
    if (stack.has(node)) {
      const cycleStart = path.indexOf(node);
      if (cycleStart !== -1) {
        cycles.push(path.slice(cycleStart).concat(node));
      }
      return;
    }
    
    if (visited.has(node)) {
      return;
    }
    
    visited.add(node);
    stack.add(node);
    path.push(node);
    
    const dependencies = graph.get(node);
    if (dependencies) {
      for (const dependency of dependencies) {
        dfs(dependency, [...path]);
      }
    }
    
    stack.delete(node);
  }
  
  for (const node of graph.keys()) {
    dfs(node);
  }
  
  return cycles;
}

/**
 * メイン関数
 */
async function main() {
  console.log("循環参照の検出を開始します...");
  
  // ソースディレクトリ内のすべてのTypeScriptファイルを解析
  for await (const entry of walk(SRC_DIR, {
    exts: [".ts"],
    skip: IGNORE_DIRS,
  })) {
    if (entry.isFile) {
      await analyzeFile(entry.path);
    }
  }
  
  // モジュール間の循環参照を検出
  const moduleCycles = detectCycles(moduleGraph);
  
  if (moduleCycles.length > 0) {
    console.log(`\n${moduleCycles.length}個のモジュール間循環参照が見つかりました：`);
    moduleCycles.forEach((cycle, index) => {
      console.log(`${index + 1}. ${cycle.join(" -> ")} -> ${cycle[0]}`);
    });
  } else {
    console.log("\nモジュール間の循環参照は見つかりませんでした。");
  }
  
  // ファイル間の循環参照を検出
  const fileCycles = detectCycles(fileGraph);
  
  if (fileCycles.length > 0) {
    console.log(`\n${fileCycles.length}個のファイル間循環参照が見つかりました：`);
    fileCycles.forEach((cycle, index) => {
      console.log(`${index + 1}. ${cycle.join(" -> ")} -> ${cycle[0]}`);
    });
    
    console.log("\n循環参照の修正方法：");
    console.log("1. インターフェースを使用して依存関係を逆転させる");
    console.log("2. 共通の依存を別のモジュールに抽出する");
    console.log("3. 依存関係の方向性を見直す");
    
    Deno.exit(1);
  } else {
    console.log("\nファイル間の循環参照は見つかりませんでした。");
  }
  
  console.log("\n循環参照の検出が完了しました。問題は見つかりませんでした。");
}

// スクリプトの実行
if (import.meta.main) {
  await main();
} 