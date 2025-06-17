import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { withApplicationConnection } from "../utils/ConnectionManager.js";

// Define the shape of a single selected Civil 3D object's information
const CivilObjectInfoSchema = z.object({
  handle: z.string().describe("The unique handle or ID of the object."),
  objectType: z.string().describe("The type of the Civil 3D object (e.g., 'Alignment', 'Surface')."),
  name: z.string().optional().describe("The name of the object, if available."),
  description: z.string().optional().describe("The description of the object, if available."),
  // Add other common properties as needed
});

// Define the expected shape of the response: an array of CivilObjectInfo
const SelectedCivilObjectsResponseSchema = z.array(CivilObjectInfoSchema);

// Define the input schema for the tool
const GetSelectedCivilObjectsInputSchema = z.object({
  limit: z.number().optional().describe("Maximum number of selected objects to return information for."),
});

export function registerGetSelectedCivilObjectsInfoTool(server: McpServer) {
  server.tool(
    "get_selected_civil_objects_info",
    "Gets basic properties of currently selected Civil 3D objects. You can limit the number of returned objects.",
    GetSelectedCivilObjectsInputSchema,
    async (args, extra) => {
      try {
        const params = {
          limit: args.limit || 100, // Default limit if not provided
        };

        const response = await withApplicationConnection(async (appClient) => {
          // The command name 'getSelectedCivilObjectsInfo' is what the Civil 3D plugin would implement
          return await appClient.sendCommand("getSelectedCivilObjectsInfo", params);
        });

        // Validate the response
        const validatedResponse = SelectedCivilObjectsResponseSchema.parse(response);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(validatedResponse, null, 2),
            },
          ],
        };
      } catch (error) {
        let errorMessage = "Failed to get selected Civil 3D objects info";
        if (error instanceof Error) {
          errorMessage += `: ${error.message}`;
        } else if (typeof error === 'string') {
          errorMessage += `: ${error}`;
        }
        console.error("Error in get_selected_civil_objects_info tool:", error);
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
