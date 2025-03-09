/**
 * 循環参照を検出するスクリプト
 * 
 * プロジェクト内のTypeScriptファイルを解析し、循環参照を検出します。
 */

import { walk } from "@std/fs/walk";
import { resolve, dirname, relative } from "@std/path";

// 解析対象のディレクトリ
const SRC_DIR = resolve(Deno.cwd(), "src");

// 依存関係を格納するマップ
const dependencies = new Map<string, Set<string>>();

// ファイルを解析して依存関係を抽出する
async function analyzeDependencies() {
  for await (const entry of walk(SRC_DIR, { exts: [".ts"], skip: [/node_modules/, /\.git/] })) {
    if (entry.isFile) {
      const filePath = entry.path;
      const content = await Deno.readTextFile(filePath);
      
      // import文を抽出
      const importRegex = /import\s+(?:[\w\s{},*]+\s+from\s+)?["']([^"']+)["']/g;
      let match;
      
      const deps = new Set<string>();
      while ((match = importRegex.exec(content)) !== null) {
        const importPath = match[1];
        
        // 相対パスのみを処理
        if (importPath.startsWith(".")) {
          const resolvedPath = resolve(dirname(filePath), importPath);
          
          // .tsや.jsが含まれていない場合は追加
          const normalizedPath = resolvedPath.endsWith(".ts") || resolvedPath.endsWith(".js")
            ? resolvedPath
            : `${resolvedPath}.ts`;
          
          deps.add(normalizedPath);
        }
      }
      
      dependencies.set(filePath, deps);
    }
  }
}

// 循環参照を検出する
function detectCircularDependencies() {
  const visited = new Set<string>();
  const recursionStack = new Set<string>();
  const circularDeps: [string, string][] = [];
  
  function dfs(file: string, path: string[] = []) {
    if (recursionStack.has(file)) {
      const cycleStart = path.findIndex(f => f === file);
      if (cycleStart >= 0) {
        const cycle = path.slice(cycleStart);
        cycle.push(file);
        
        // 循環参照を記録
        for (let i = 0; i < cycle.length - 1; i++) {
          circularDeps.push([cycle[i], cycle[i + 1]]);
        }
      }
      return;
    }
    
    if (visited.has(file)) {
      return;
    }
    
    visited.add(file);
    recursionStack.add(file);
    
    const deps = dependencies.get(file);
    if (deps) {
      for (const dep of deps) {
        dfs(dep, [...path, file]);
      }
    }
    
    recursionStack.delete(file);
  }
  
  // すべてのファイルに対してDFSを実行
  for (const file of dependencies.keys()) {
    dfs(file);
  }
  
  return circularDeps;
}

// 結果を表示する
function printResults(circularDeps: [string, string][]) {
  if (circularDeps.length === 0) {
    console.log("循環参照は見つかりませんでした。");
    return;
  }
  
  console.log(`${circularDeps.length}個の循環参照が見つかりました：`);
  
  // 循環参照をグループ化して表示
  const cycles = new Map<string, string[]>();
  
  for (const [from, to] of circularDeps) {
    const relFrom = relative(SRC_DIR, from);
    const relTo = relative(SRC_DIR, to);
    
    if (!cycles.has(relFrom)) {
      cycles.set(relFrom, []);
    }
    
    cycles.get(relFrom)!.push(relTo);
  }
  
  for (const [file, deps] of cycles.entries()) {
    console.log(`\n${file} は以下のファイルと循環参照しています：`);
    for (const dep of deps) {
      console.log(`  - ${dep}`);
    }
  }
}

// メイン処理
async function main() {
  console.log("依存関係を解析中...");
  await analyzeDependencies();
  
  console.log("循環参照を検出中...");
  const circularDeps = detectCircularDependencies();
  
  printResults(circularDeps);
}

main().catch(console.error); 