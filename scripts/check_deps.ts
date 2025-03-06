/**
 * モジュール間の依存関係をチェックするスクリプト
 * - モジュール間のimportがmod.tsを経由しているか
 * - 他のモジュールのファイルを直接参照していないか
 */

import { walk } from "https://deno.land/std@0.218.2/fs/walk.ts";
import { parse } from "https://deno.land/std@0.218.2/path/parse.ts";
import { join } from "https://deno.land/std@0.218.2/path/join.ts";

const SRC_DIR = "./src";
const IGNORE_DIRS = ["node_modules", ".git", "dist"];

interface ImportInfo {
  source: string;
  imports: string[];
}

async function main() {
  const importMap: Map<string, ImportInfo> = new Map();
  const moduleMap: Map<string, string[]> = new Map();

  // ファイルを走査してインポート情報を収集
  for await (const entry of walk(SRC_DIR, {
    includeDirs: false,
    exts: [".ts", ".tsx"],
    skip: IGNORE_DIRS.map((dir) => new RegExp(`${dir}`)),
  })) {
    if (entry.name.endsWith(".test.ts") || entry.name.endsWith(".spec.ts")) {
      continue;
    }

    const content = await Deno.readTextFile(entry.path);
    const imports = extractImports(content);
    
    if (imports.length > 0) {
      importMap.set(entry.path, {
        source: entry.path,
        imports,
      });
    }

    // モジュールマップを構築
    const pathParts = entry.path.replace(SRC_DIR, "").split("/");
    if (pathParts.length > 2) {
      const moduleName = pathParts[1]; // src/[module]/...
      if (!moduleMap.has(moduleName)) {
        moduleMap.set(moduleName, []);
      }
      moduleMap.get(moduleName)?.push(entry.path);
    }
  }

  // 依存関係をチェック
  let hasViolation = false;
  
  for (const [filePath, info] of importMap.entries()) {
    const fileModule = getModuleFromPath(filePath);
    
    for (const importPath of info.imports) {
      // 相対パスのインポートのみチェック
      if (!importPath.startsWith(".")) continue;
      
      const absoluteImportPath = resolveImportPath(filePath, importPath);
      const importModule = getModuleFromPath(absoluteImportPath);
      
      // 異なるモジュール間の参照をチェック
      if (fileModule && importModule && fileModule !== importModule) {
        // mod.tsを経由しているかチェック
        if (!importPath.endsWith("/mod.ts") && !importPath.endsWith("/mod")) {
          console.error(`❌ モジュール間の参照はmod.tsを経由する必要があります: ${filePath} -> ${importPath}`);
          console.error(`   修正案: import { ... } from "../${importModule}/mod.ts"`);
          hasViolation = true;
        }
      }
    }
  }

  if (hasViolation) {
    console.error("\n依存関係の問題が見つかりました。上記の修正案を参考にしてください。");
    Deno.exit(1);
  } else {
    console.log("✅ 依存関係のチェックが完了しました。問題は見つかりませんでした。");
  }
}

/**
 * ファイルパスからモジュール名を抽出
 */
function getModuleFromPath(path: string): string | null {
  const match = path.match(/src\/([^\/]+)/);
  return match ? match[1] : null;
}

/**
 * インポートパスを絶対パスに解決
 */
function resolveImportPath(filePath: string, importPath: string): string {
  const dir = parse(filePath).dir;
  const normalizedImportPath = importPath.endsWith(".ts") 
    ? importPath 
    : `${importPath}.ts`;
  
  return join(dir, normalizedImportPath);
}

/**
 * ファイルからインポート文を抽出
 */
function extractImports(content: string): string[] {
  const importRegex = /import\s+(?:[\w\s{},*]+\s+from\s+)?["']([^"']+)["']/g;
  const imports: string[] = [];
  let match;
  
  while ((match = importRegex.exec(content)) !== null) {
    imports.push(match[1]);
  }
  
  return imports;
}

if (import.meta.main) {
  main();
} 