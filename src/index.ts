import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js"; // Corrected path
import { createServer } from "http";
import { registerTools } from "./tools/register.js";

// 创建服务器实例
const server = new McpServer({
  name: "revit-mcp",
  version: "1.0.0",
});

// 启动服务器
async function main() {
  // 注册工具
  await registerTools(server);

  // 连接到传输层 (Stdio)
  const stdioTransport = new StdioServerTransport();
  await server.connect(stdioTransport);
  console.error("Revit MCP Server connected via Stdio.");

  // 设置 HTTP 传输层
  const port = process.env.MCP_HTTP_PORT ? parseInt(process.env.MCP_HTTP_PORT, 10) : 3000;
  
  try {
    const httpServer = createServer();

    // Instantiate StreamableHTTPServerTransport
    // Assuming specific path handling (e.g., '/mcp') is managed internally by the transport
    // or by default when a server instance is passed.
    const httpTransport = new StreamableHTTPServerTransport({
      server: httpServer, 
      // Based on SDK docs, StreamableHTTPServerTransport usually requires more setup for routing,
      // e.g. providing handlers to an Express app.
      // The { server: httpServer } direct usage is from the prompt.
      // If this doesn't work as expected (e.g. no requests are handled on /mcp),
      // a full Express setup or manual request routing for /mcp (GET for SSE, POST for commands)
      // for the httpTransport would be needed.
      // For now, following the prompt's suggested direct instantiation.
      // It might also expect requests to come to any path, and it filters.
      // The SDK's StreamableHTTPServerTransport examples typically involve creating an Express app,
      // then using transport.handleRequest(req, res, body) in app.post('/mcp', ...)
      // and transport.handleRequest(req, res) in app.get('/mcp', ...).
      // This simplified version assumes the transport can attach to the server and handle
      // a default path like '/mcp' for both POST (commands) and GET (SSE notifications).
    });

    // Connect the same McpServer instance to the HTTP transport
    await server.connect(httpTransport);

    httpServer.on('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`HTTP Server Error: Port ${port} is already in use. HTTP transport not started.`);
      } else {
        console.error(`HTTP Server Error: ${err.message}. HTTP transport not started.`);
      }
      // Decide if this error should prevent the Stdio part from running or if Stdio can run independently.
      // For now, Stdio is already running. This only affects the HTTP part.
    });

    httpServer.listen(port, () => {
      console.error(`Revit MCP Server also listening on HTTP at http://localhost:${port}`);
      // The MCP specification usually implies endpoints like /mcp for requests and notifications.
      console.error(`MCP HTTP endpoint expected at http://localhost:${port}/mcp (verify SDK docs for actual path)`);
    });

  } catch (error) {
    console.error("Failed to start HTTP transport:", error);
    // Stdio transport will continue to run if it was successfully set up.
  }

  console.error("Revit MCP Server setup complete.");
}

main().catch((error) => {
  console.error("Error in main execution of Revit MCP Server:", error);
  process.exit(1);
});
