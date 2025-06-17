import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { withApplicationConnection } from "../utils/ConnectionManager.js";

// Define the expected shape of the response from the Civil 3D plugin
const CivilObjectTypesResponseSchema = z.array(z.string());

export function registerListCivilObjectTypesTool(server: McpServer) {
  server.tool(
    "list_civil_object_types",
    "Lists major Civil 3D object types available or present in the current drawing (e.g., Alignments, Surfaces).",
    {}, // No input schema
    async (args, extra) => {
      try {
        const response = await withApplicationConnection(async (appClient) => {
          // The command name 'listCivilObjectTypes' is what the Civil 3D plugin side would implement
          return await appClient.sendCommand("listCivilObjectTypes", {});
        });

        // Validate the response
        const validatedResponse = CivilObjectTypesResponseSchema.parse(response);

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(validatedResponse, null, 2),
            },
          ],
        };
      } catch (error) {
        let errorMessage = "Failed to list Civil 3D object types";
        if (error instanceof Error) {
          errorMessage += `: ${error.message}`;
        } else if (typeof error === 'string') {
          errorMessage += `: ${error}`;
        }
        console.error("Error in list_civil_object_types tool:", error);
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
