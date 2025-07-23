import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

export async function registerTools(server: McpServer) {
  // 現在のファイルのディレクトリパスを取得
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  // toolsディレクトリ内のすべてのファイルを読み込む
  const files = fs.readdirSync(__dirname);

  // .tsまたは.jsファイルを抽出。ただしindexファイルとregisterファイルは除外
  const toolFiles = files.filter(
    (file) =>
      (file.endsWith(".ts") || file.endsWith(".js")) &&
      file !== "index.ts" &&
      file !== "index.js" &&
      file !== "register.ts" &&
      file !== "register.js"
  );

  // 各ツールを動的にインポートして登録
  for (const file of toolFiles) {
    try {
      // インポートパスを構築
      const importPath = `./${file.replace(/\.(ts|js)$/, ".js")}`;

      // モジュールを動的にインポート
      const module = await import(importPath);

      // 登録関数を探して実行
      const registerFunctionName = Object.keys(module).find(
        (key) => key.startsWith("register") && typeof module[key] === "function"
      );

      if (registerFunctionName) {
        module[registerFunctionName](server);
        console.error(`ツールを登録しました: ${file}`);
      } else {
        console.warn(`警告: ファイル ${file} に登録関数が見つかりません`);
      }
    } catch (error) {
      console.error(`ツール ${file} の登録中にエラーが発生しました:`, error);
    }
  }
}
