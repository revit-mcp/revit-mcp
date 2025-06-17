import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { withApplicationConnection } from "../utils/ConnectionManager.js";

// Define the expected shape of the response from the Civil 3D plugin
const DrawingInfoResponseSchema = z.object({
  drawingName: z.string().optional(),
  projectName: z.string().optional(),
  coordinateSystem: z.string().optional(),
  units: z.string().optional(),
  // Add other relevant fields as needed
});

export function registerGetDrawingInfoTool(server: McpServer) {
  server.tool(
    "get_drawing_info",
    "Retrieves basic information about the active Civil 3D drawing.",
    {}, // No input schema
    async (args, extra) => {
      try {
        const response = await withApplicationConnection(async (appClient) => {
          // The command name 'getDrawingInfo' is what the Civil 3D plugin side would implement
          return await appClient.sendCommand("getDrawingInfo", {});
        });

        // Validate the response from the plugin (optional, but good practice)
        const validatedResponse = DrawingInfoResponseSchema.parse(response);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(validatedResponse, null, 2),
            },
          ],
        };
      } catch (error) {
        let errorMessage = "Failed to get drawing info";
        if (error instanceof Error) {
          errorMessage += `: ${error.message}`;
        } else if (typeof error === 'string') {
          errorMessage += `: ${error}`;
        }
        // Log the detailed error for server-side debugging
        console.error("Error in get_drawing_info tool:", error);
        return {
          content: [
            {
              type: "text",
              text: errorMessage,
            },
          ],
          isError: true,
        };
      }
    }
  );
}
