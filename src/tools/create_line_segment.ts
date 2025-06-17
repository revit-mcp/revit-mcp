import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { withApplicationConnection } from "../utils/ConnectionManager.js";

// Define the input schema for creating a line segment
const CreateLineInputSchema = z.object({
  startX: z.number().describe("The X coordinate of the line's start point."),
  startY: z.number().describe("The Y coordinate of the line's start point."),
  startZ: z.number().optional().describe("The Z coordinate (elevation) of the line's start point."),
  endX: z.number().describe("The X coordinate of the line's end point."),
  endY: z.number().describe("The Y coordinate of the line's end point."),
  endZ: z.number().optional().describe("The Z coordinate (elevation) of the line's end point."),
});

// Define the expected shape of the response after creating a line
const LineCreationResponseSchema = z.object({
  lineId: z.string().describe("The ID or handle of the newly created line segment."),
  // Include other properties if the plugin returns them, e.g., length
});

export function registerCreateLineSegmentTool(server: McpServer) {
  server.tool(
    "create_line_segment",
    "Creates a simple line segment in the Civil 3D drawing.",
    CreateLineInputSchema,
    async (args, extra) => {
      try {
        const params = {
          startX: args.startX,
          startY: args.startY,
          startZ: args.startZ,
          endX: args.endX,
          endY: args.endY,
          endZ: args.endZ,
        };

        const response = await withApplicationConnection(async (appClient) => {
          // The command name 'createLineSegment' is what the Civil 3D plugin would implement
          return await appClient.sendCommand("createLineSegment", params);
        });

        // Validate the response
        const validatedResponse = LineCreationResponseSchema.parse(response);

        return {
          content: [
            {
              type: "text",
              text: `Line segment created successfully: ${JSON.stringify(validatedResponse, null, 2)}`,
            },
          ],
        };
      } catch (error) {
        let errorMessage = "Failed to create line segment";
        if (error instanceof Error) {
          errorMessage += `: ${error.message}`;
        } else if (typeof error === 'string') {
          errorMessage += `: ${error}`;
        }
        console.error("Error in create_line_segment tool:", error);
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
