import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { withApplicationConnection } from "../utils/ConnectionManager.js";

// Define the input schema for creating a COGO point
const CreateCogoPointInputSchema = z.object({
  easting: z.number().describe("The Easting coordinate of the point."),
  northing: z.number().describe("The Northing coordinate of the point."),
  elevation: z.number().optional().describe("The elevation of the point."),
  rawDescription: z.string().optional().describe("The raw description for the point."),
});

// Define the expected shape of the response after creating a COGO point
const CogoPointCreationResponseSchema = z.object({
  pointId: z.union([z.string(), z.number()]).describe("The ID or number of the newly created COGO point."),
  easting: z.number(),
  northing: z.number(),
  elevation: z.number().optional(),
  rawDescription: z.string().optional(),
  // Add other relevant fields as needed
});

export function registerCreateCogoPointTool(server: McpServer) {
  server.tool(
    "create_cogo_point",
    "Creates a new COGO (Coordinate Geometry) point in the Civil 3D drawing.",
    CreateCogoPointInputSchema,
    async (args, extra) => {
      try {
        const params = {
          easting: args.easting,
          northing: args.northing,
          elevation: args.elevation,
          rawDescription: args.rawDescription,
        };

        const response = await withApplicationConnection(async (appClient) => {
          // The command name 'createCogoPoint' is what the Civil 3D plugin would implement
          return await appClient.sendCommand("createCogoPoint", params);
        });

        // Validate the response
        const validatedResponse = CogoPointCreationResponseSchema.parse(response);

        return {
          content: [
            {
              type: "text",
              text: `COGO Point created successfully: ${JSON.stringify(validatedResponse, null, 2)}`,
            },
          ],
        };
      } catch (error) {
        let errorMessage = "Failed to create COGO point";
        if (error instanceof Error) {
          errorMessage += `: ${error.message}`;
        } else if (typeof error === 'string') {
          errorMessage += `: ${error}`;
        }
        console.error("Error in create_cogo_point tool:", error);
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
