import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerTools } from "./tools/register.js";
// サーバーインスタンスを作成
const server = new McpServer({
    name: "revit-mcp",
    version: "1.0.0",
});
// サーバーを起動
async function main() {
    // ツールを登録
    await registerTools(server);
    // トランスポート層に接続
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Revit MCP Server start success");
}
main().catch((error) => {
    console.error("Error starting Revit MCP Server:", error);
    process.exit(1);
});
